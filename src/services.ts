import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  addDoc,
  serverTimestamp,
  onSnapshot,
  orderBy
} from "firebase/firestore";
import { db } from "./lib/firebase";
import type { Student, Skill } from "./types";

function requireDb() {
  if (!db) {
    throw new Error("Firestore is not initialized.");
  }
  return db;
}

export function mapFirestoreUserToStudent(uid: string, data: any): Student {
  return {
    id: uid,
    name: data.name || "Student",
    headline: data.headline || `${data.yearOfStudy || "Student"} • ${data.college || "College"}`,
    location: data.location || "Bengaluru",
    college: data.college || "",
    year: data.yearOfStudy || "",
    rating: data.rating || 5.0,
    responseRate: data.responseRate || "100%",
    availability: data.availability || "Flexible",
    avatar: data.avatar || (data.name ? data.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() : "SS"),
    about: data.bio || "Tell the SkillSwap community what you love building and what you want to learn.",
    teachSkills: data.teachSkills || [],
    learnSkills: data.learnSkills || [],
    projects: data.projects || [],
    reviews: data.reviews || [],
    reputation: data.reputation || {
      xp: 2480,
      level: 12,
      title: "Knowledge Builder"
    }
  };
}

export const api = {
  async getUsers() {
    const firestore = requireDb();
    const snapshot = await getDocs(collection(firestore, "users"));
    return snapshot.docs.map(doc => mapFirestoreUserToStudent(doc.id, doc.data()));
  },

  async getUser(id: string) {
    const firestore = requireDb();
    const snap = await getDoc(doc(firestore, "users", id));
    if (!snap.exists()) {
      throw new Error("User does not exist");
    }
    return mapFirestoreUserToStudent(snap.id, snap.data());
  },

  async getSkills() {
    const firestore = requireDb();
    const snapshot = await getDocs(collection(firestore, "skills"));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Skill));
  },

  async getRequests() {
    const firestore = requireDb();
    const snapshot = await getDocs(collection(firestore, "requests"));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
  },

  async getMatches() {
    return [];
  },

  async getMessages() {
    return [];
  },

  // Subscriptions
  subscribeUsers(callback: (users: Student[]) => void) {
    const firestore = requireDb();
    return onSnapshot(collection(firestore, "users"), (snapshot) => {
      const list = snapshot.docs.map(doc => mapFirestoreUserToStudent(doc.id, doc.data()));
      callback(list);
    });
  },

  subscribeSkills(callback: (skills: Skill[]) => void) {
    const firestore = requireDb();
    return onSnapshot(collection(firestore, "skills"), (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Skill));
      callback(list);
    });
  },

  subscribeRequests(uid: string, callback: (requests: any[]) => void) {
    const firestore = requireDb();
    const q1 = query(collection(firestore, "requests"), where("senderId", "==", uid));
    const q2 = query(collection(firestore, "requests"), where("receiverId", "==", uid));

    let r1: any[] = [];
    let r2: any[] = [];

    const updateAndCallback = () => {
      // De-duplicate by request ID
      const merged = [...r1, ...r2];
      const seen = new Set();
      const unique = merged.filter(item => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      });
      callback(unique);
    };

    const unsub1 = onSnapshot(q1, (snap) => {
      r1 = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      updateAndCallback();
    });

    const unsub2 = onSnapshot(q2, (snap) => {
      r2 = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      updateAndCallback();
    });

    return () => {
      unsub1();
      unsub2();
    };
  },

  subscribeConversations(uid: string, callback: (conversations: any[]) => void) {
    const firestore = requireDb();
    const q = query(
      collection(firestore, "conversations"),
      where("participantIds", "array-contains", uid)
    );
    return onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(list);
    });
  },

  subscribeMessages(conversationId: string, callback: (messages: any[]) => void) {
    const firestore = requireDb();
    const q = query(
      collection(firestore, "conversations", conversationId, "messages"),
      orderBy("createdAt", "asc")
    );
    return onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(list);
    });
  },

  // Actions
  async addSkill(skill: Omit<Skill, "id" | "learners" | "tags"> & { type: "teach" | "learn" }) {
    const firestore = requireDb();
    const docRef = await addDoc(collection(firestore, "skills"), {
      ...skill,
      learners: 0,
      tags: [skill.category, skill.level],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Also update student profile
    const userDocRef = doc(firestore, "users", skill.teacherId);
    const userSnap = await getDoc(userDocRef);
    if (userSnap.exists()) {
      const userData = userSnap.data();
      const currentSkills = skill.type === "teach" ? (userData.teachSkills || []) : (userData.learnSkills || []);
      if (!currentSkills.includes(skill.name)) {
        currentSkills.push(skill.name);
        await updateDoc(userDocRef, {
          [skill.type === "teach" ? "teachSkills" : "learnSkills"]: currentSkills,
          updatedAt: serverTimestamp()
        });
      }
    }

    return docRef.id;
  },

  async editSkill(skillId: string, skill: Partial<Skill> & { type: "teach" | "learn" }) {
    const firestore = requireDb();
    await updateDoc(doc(firestore, "skills", skillId), {
      ...skill,
      updatedAt: serverTimestamp()
    });

    // Also update student profile list if name changes
    if (skill.name && skill.teacherId) {
      const userDocRef = doc(firestore, "users", skill.teacherId);
      const userSnap = await getDoc(userDocRef);
      if (userSnap.exists()) {
        // Just sync all skills of this type
        const skillsSnap = await getDocs(
          query(
            collection(firestore, "skills"),
            where("teacherId", "==", skill.teacherId),
            where("type", "==", skill.type)
          )
        );
        const names = skillsSnap.docs.map(d => d.data().name);
        await updateDoc(userDocRef, {
          [skill.type === "teach" ? "teachSkills" : "learnSkills"]: names,
          updatedAt: serverTimestamp()
        });
      }
    }
  },

  async deleteSkill(skillId: string, teacherId: string, name: string, type: "teach" | "learn") {
    const firestore = requireDb();
    await deleteDoc(doc(firestore, "skills", skillId));

    const userDocRef = doc(firestore, "users", teacherId);
    const userSnap = await getDoc(userDocRef);
    if (userSnap.exists()) {
      const userData = userSnap.data();
      const currentSkills = type === "teach" ? (userData.teachSkills || []) : (userData.learnSkills || []);
      const updatedSkills = currentSkills.filter((s: string) => s !== name);
      await updateDoc(userDocRef, {
        [type === "teach" ? "teachSkills" : "learnSkills"]: updatedSkills,
        updatedAt: serverTimestamp()
      });
    }
  },

  async sendRequest(senderId: string, receiverId: string, skillId: string, message: string, skillName: string) {
    const firestore = requireDb();
    
    // Check duplicate pending requests
    const q = query(
      collection(firestore, "requests"),
      where("senderId", "==", senderId),
      where("receiverId", "==", receiverId),
      where("skillId", "==", skillId),
      where("status", "==", "PENDING")
    );
    const dupCheck = await getDocs(q);
    if (!dupCheck.empty) {
      throw new Error("You already have a pending request for this skill.");
    }

    const docRef = await addDoc(collection(firestore, "requests"), {
      senderId,
      receiverId,
      skillId,
      skillName,
      message,
      status: "PENDING",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Create a notification for the receiver
    try {
      const senderSnap = await getDoc(doc(firestore, "users", senderId));
      const senderName = senderSnap.exists() ? senderSnap.data().name : "A student";
      await addDoc(collection(firestore, "notifications"), {
        userId: receiverId,
        type: "new_request",
        title: "New Skill Request",
        message: `${senderName} wants to learn "${skillName}" from you.`,
        read: false,
        createdAt: serverTimestamp()
      });
    } catch (e) {
      console.error("Failed to create request notification:", e);
    }

    return docRef.id;
  },

  async updateRequestStatus(requestId: string, status: "ACCEPTED" | "REJECTED" | "CANCELLED" | "COMPLETED", requestData?: any) {
    const firestore = requireDb();
    await updateDoc(doc(firestore, "requests", requestId), {
      status,
      updatedAt: serverTimestamp()
    });

    const finalRequestData = requestData || (await getDoc(doc(firestore, "requests", requestId))).data();

    if (status === "ACCEPTED" && finalRequestData) {
      // Deterministic conversation ID based on participant UIDs sorted alphabetically
      const convId = [finalRequestData.senderId, finalRequestData.receiverId].sort().join("_");
      const convRef = doc(firestore, "conversations", convId);
      const convSnap = await getDoc(convRef);

      if (!convSnap.exists()) {
        await setDoc(convRef, {
          participantIds: [finalRequestData.senderId, finalRequestData.receiverId],
          skillId: finalRequestData.skillId,
          topic: `${finalRequestData.skillName || "Skill Exchange"}`,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastMessage: "Conversation started.",
          lastMessageAt: serverTimestamp(),
          lastSenderId: ""
        });
      }
    }

    // Create a notification for the sender
    try {
      if (finalRequestData) {
        const receiverSnap = await getDoc(doc(firestore, "users", finalRequestData.receiverId));
        const receiverName = receiverSnap.exists() ? receiverSnap.data().name : "A student";

        if (status === "ACCEPTED") {
          await addDoc(collection(firestore, "notifications"), {
            userId: finalRequestData.senderId,
            type: "request_accepted",
            title: "Request Accepted",
            message: `Your request to learn "${finalRequestData.skillName}" was accepted by ${receiverName}.`,
            read: false,
            createdAt: serverTimestamp()
          });
        } else if (status === "REJECTED") {
          await addDoc(collection(firestore, "notifications"), {
            userId: finalRequestData.senderId,
            type: "request_rejected",
            title: "Request Declined",
            message: `Your request to learn "${finalRequestData.skillName}" was declined.`,
            read: false,
            createdAt: serverTimestamp()
          });
        }
      }
    } catch (e) {
      console.error("Failed to create status update notification:", e);
    }
  },

  async sendMessage(conversationId: string, senderId: string, text: string) {
    const firestore = requireDb();
    await addDoc(collection(firestore, "conversations", conversationId, "messages"), {
      senderId,
      text,
      createdAt: serverTimestamp()
    });

    await updateDoc(doc(firestore, "conversations", conversationId), {
      lastMessage: text,
      lastMessageAt: serverTimestamp(),
      lastSenderId: senderId,
      updatedAt: serverTimestamp()
    });

    // Create a notification for the receiver
    try {
      const convSnap = await getDoc(doc(firestore, "conversations", conversationId));
      if (convSnap.exists()) {
        const convData = convSnap.data();
        const receiverId = convData.participantIds.find((id: string) => id !== senderId);
        
        const senderSnap = await getDoc(doc(firestore, "users", senderId));
        const senderName = senderSnap.exists() ? senderSnap.data().name : "Someone";

        if (receiverId) {
          await addDoc(collection(firestore, "notifications"), {
            userId: receiverId,
            type: "new_message",
            title: "New Message",
            message: `${senderName}: "${text.substring(0, 30)}${text.length > 30 ? "..." : ""}"`,
            read: false,
            createdAt: serverTimestamp()
          });
        }
      }
    } catch (e) {
      console.error("Failed to create message notification:", e);
    }
  },

  subscribeNotifications(uid: string, callback: (notifications: any[]) => void) {
    const firestore = requireDb();
    const q = query(
      collection(firestore, "notifications"),
      where("userId", "==", uid),
      orderBy("createdAt", "desc")
    );
    return onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(list);
    });
  },

  async markNotificationAsRead(notificationId: string) {
    const firestore = requireDb();
    await updateDoc(doc(firestore, "notifications", notificationId), {
      read: true
    });
  },

  async seedDemoData() {
    const firestore = requireDb();
    const rahulSnap = await getDoc(doc(firestore, "users", "demo-rahul"));
    if (rahulSnap.exists()) {
      return; // Already seeded
    }

    // Clean up any existing demo skills to prevent duplicates
    try {
      const skillsSnap = await getDocs(collection(firestore, "skills"));
      for (const d of skillsSnap.docs) {
        const data = d.data();
        if (data.teacherId && data.teacherId.startsWith("demo-")) {
          await deleteDoc(doc(firestore, "skills", d.id));
        }
      }
    } catch (e) {
      console.error("Clean up of demo skills failed:", e);
    }

    const demoUsers = [
      {
        uid: "demo-rahul",
        name: "Rahul Sharma",
        bio: "Computer science student passionate about full-stack development and competitive programming.",
        college: "Delhi Technological University",
        yearOfStudy: "2nd Year",
        avatar: "RS",
        teachSkills: ["Python", "React", "Java", "Data Structures"],
        learnSkills: ["Machine Learning", "Cloud Computing"],
        availability: "Weekdays evenings"
      },
      {
        uid: "demo-ananya",
        name: "Ananya Reddy",
        bio: "AI enthusiast exploring computer vision, deep learning, and intelligent applications.",
        college: "IIIT Hyderabad",
        yearOfStudy: "4th Year",
        avatar: "AR",
        teachSkills: ["Machine Learning", "Python", "Computer Vision", "TensorFlow"],
        learnSkills: ["React", "UI/UX"],
        availability: "Weekends"
      },
      {
        uid: "demo-arjun",
        name: "Arjun Rao",
        bio: "ECE student building embedded systems, IoT prototypes, and Arduino projects.",
        college: "RV College of Engineering",
        yearOfStudy: "3rd Year",
        avatar: "AJ",
        teachSkills: ["Arduino", "Embedded Systems", "IoT", "C/C++"],
        learnSkills: ["Machine Learning", "PCB Design"],
        availability: "Weekday evenings"
      },
      {
        uid: "demo-priya",
        name: "Priya Nair",
        bio: "Creative designer interested in building beautiful digital products and user experiences.",
        college: "PES University",
        yearOfStudy: "4th Year",
        avatar: "PN",
        teachSkills: ["UI/UX Design", "Figma", "Graphic Design", "Prototyping"],
        learnSkills: ["React", "Frontend Development"],
        availability: "Saturday and Sunday"
      },
      {
        uid: "demo-karthik",
        name: "Karthik Varma",
        bio: "Web developer focused on modern JavaScript applications and scalable frontend systems.",
        college: "MSRIT",
        yearOfStudy: "3rd Year",
        avatar: "KV",
        teachSkills: ["JavaScript", "React", "TypeScript", "HTML/CSS"],
        learnSkills: ["Python", "AI"],
        availability: "Weekdays"
      },
      {
        uid: "demo-meera",
        name: "Meera Iyer",
        bio: "Data enthusiast working on analytics, visualization, and practical machine learning projects.",
        college: "BITS Pilani",
        yearOfStudy: "3rd Year",
        avatar: "MI",
        teachSkills: ["Python", "Data Analysis", "SQL", "Data Visualization"],
        learnSkills: ["Deep Learning", "Cloud Computing"],
        availability: "Evenings"
      },
      {
        uid: "demo-aditya",
        name: "Aditya Kumar",
        bio: "Cybersecurity learner interested in ethical security, networking, and secure development.",
        college: "VIT Vellore",
        yearOfStudy: "3rd Year",
        avatar: "AK",
        teachSkills: ["Networking", "Linux", "Cybersecurity Basics", "Git"],
        learnSkills: ["Cloud Security", "Penetration Testing"],
        availability: "Weekends"
      },
      {
        uid: "demo-sneha",
        name: "Sneha Patel",
        bio: "Content creator and photographer who enjoys combining technology with visual storytelling.",
        college: "NID Ahmedabad",
        yearOfStudy: "4th Year",
        avatar: "SP",
        teachSkills: ["Photography", "Video Editing", "Canva", "Content Creation"],
        learnSkills: ["Graphic Design", "UI/UX"],
        availability: "Friday evenings and weekends"
      },
      {
        uid: "demo-vikram",
        name: "Vikram Singh",
        bio: "Competitive programmer and software engineering enthusiast who enjoys algorithms and problem solving.",
        college: "IIT Bombay",
        yearOfStudy: "4th Year",
        avatar: "VS",
        teachSkills: ["C++", "Data Structures", "Algorithms", "Competitive Programming"],
        learnSkills: ["System Design", "Machine Learning"],
        availability: "Weekdays evenings"
      },
      {
        uid: "demo-ishita",
        name: "Ishita Rao",
        bio: "Electronics student exploring robotics, automation, and intelligent hardware systems.",
        college: "COEP Pune",
        yearOfStudy: "3rd Year",
        avatar: "IR",
        teachSkills: ["Robotics", "Arduino", "Electronics", "Embedded C"],
        learnSkills: ["Computer Vision", "Python"],
        availability: "Saturday mornings"
      }
    ];

    const getCategory = (name: string) => {
      const lower = name.toLowerCase();
      if (["react", "javascript", "html & css", "html/css", "python", "java", "data structures", "c/c++", "typescript", "c++", "algorithms", "competitive programming", "networking", "linux", "cybersecurity basics", "git", "sql", "data analysis", "data visualization"].some(s => lower.includes(s))) return "Programming";
      if (["machine learning", "computer vision", "tensorflow", "deep learning", "ai"].some(s => lower.includes(s))) return "AI & ML";
      if (["arduino", "embedded systems", "iot", "electronics", "robotics", "embedded c", "pcb design"].some(s => lower.includes(s))) return "Electronics";
      if (["ui/ux", "graphic design", "figma", "prototyping", "photography", "video editing", "canva", "content creation"].some(s => lower.includes(s))) return "Design";
      if (["business", "product strategy", "marketing"].some(s => lower.includes(s))) return "Business";
      if (["languages", "english", "spanish"].some(s => lower.includes(s))) return "Languages";
      return "Programming";
    };

    for (const u of demoUsers) {
      const { uid, ...profile } = u;
      await setDoc(doc(firestore, "users", uid), {
        ...profile,
        email: `${uid.split("-")[1]}.demo@skillswap.local`,
        onboardingCompleted: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Add their skills to the skills collection
      for (const skillName of profile.teachSkills) {
        await addDoc(collection(firestore, "skills"), {
          name: skillName,
          category: getCategory(skillName),
          description: `I can help beginners and intermediate students with ${skillName} fundamentals, practical applications, and problem solving.`,
          level: "Intermediate",
          availability: profile.availability,
          teacherId: uid,
          learners: 5,
          tags: [skillName, "Demo"],
          type: "teach",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }

      for (const skillName of profile.learnSkills) {
        await addDoc(collection(firestore, "skills"), {
          name: skillName,
          category: getCategory(skillName),
          description: `I want to learn ${skillName} to apply it to my projects and coursework.`,
          level: "Beginner",
          availability: profile.availability,
          teacherId: uid,
          learners: 0,
          tags: [skillName, "Demo"],
          type: "learn",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
    }
  }
};
