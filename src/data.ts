import type { Match, MessageThread, RequestItem, Skill, Student } from "./types";

export const students: Student[] = [
  {
    id: "arjun",
    name: "Arjun Rao",
    headline: "ECE student • AI enthusiast • Electronics builder",
    location: "Bengaluru",
    college: "RV College of Engineering",
    year: "3rd Year",
    rating: 4.9,
    responseRate: "97%",
    availability: "Evenings",
    avatar: "AR",
    about:
      "I love teaching through projects. Most of my sessions blend Python, hardware, and product thinking so learners leave with something real they built themselves.",
    teachSkills: ["Python", "Arduino", "Machine Learning", "UI/UX"],
    learnSkills: ["Cloud Computing", "Cybersecurity", "Computer Vision"],
    projects: [
      {
        title: "Campus Air Monitor",
        description: "Built an IoT dashboard for air quality sensors across the hostel blocks.",
        technologies: ["Arduino", "React", "MQTT"],
      },
      {
        title: "StudySprint",
        description: "A spaced repetition planner for engineering students with adaptive quizzes.",
        technologies: ["TypeScript", "Supabase", "Figma"],
      },
    ],
    reviews: [
      {
        author: "Priya Nair",
        rating: 5,
        text: "Explained React concepts incredibly well. Very patient and practical.",
      },
      {
        author: "Sarah Khan",
        rating: 5,
        text: "His Arduino sessions were structured, fun, and easy to follow.",
      },
    ],
    reputation: {
      xp: 2480,
      level: 12,
      title: "Knowledge Builder",
    },
  },
  {
    id: "sarah",
    name: "Sarah Khan",
    headline: "CS student • AI builder • Community mentor",
    location: "Hyderabad",
    college: "IIIT Hyderabad",
    year: "Final Year",
    rating: 4.9,
    responseRate: "94%",
    availability: "Available now",
    avatar: "SK",
    about:
      "I help students get comfortable with Python and AI by using real datasets, tiny experiments, and lots of visual intuition.",
    teachSkills: ["Python", "Computer Vision", "AI Agents"],
    learnSkills: ["Public Speaking", "Product Strategy"],
    projects: [
      {
        title: "LabLens",
        description: "A lightweight computer vision tool for chemistry lab observations.",
        technologies: ["Python", "OpenCV", "FastAPI"],
      },
    ],
    reviews: [
      {
        author: "Aditya Mehta",
        rating: 5,
        text: "Her Python mentoring made ML finally click for me.",
      },
    ],
    reputation: {
      xp: 2910,
      level: 14,
      title: "Top Mentor",
    },
  },
  {
    id: "rahul",
    name: "Rahul Sharma",
    headline: "Full-stack dev • ML explorer • Hackathon regular",
    location: "Delhi",
    college: "DTU",
    year: "2nd Year",
    rating: 4.8,
    responseRate: "92%",
    availability: "Weekends",
    avatar: "RS",
    about:
      "I like making hard technical ideas approachable. My sessions focus on shipping quickly and learning by building.",
    teachSkills: ["React", "JavaScript", "Next.js"],
    learnSkills: ["Machine Learning", "Embedded AI"],
    projects: [
      {
        title: "CampusPulse",
        description: "A social feed for clubs, events, and student communities.",
        technologies: ["Next.js", "PostgreSQL", "Tailwind"],
      },
    ],
    reviews: [
      {
        author: "Karthik Varma",
        rating: 5,
        text: "Fantastic at explaining advanced React without overcomplicating it.",
      },
    ],
    reputation: {
      xp: 2140,
      level: 11,
      title: "Momentum Mentor",
    },
  },
];

export const skills: Skill[] = [
  {
    id: "python-ai",
    name: "Python",
    category: "AI & ML",
    description: "Learn Python from a student building real-world AI projects.",
    teacherId: "sarah",
    level: "Intermediate",
    availability: "Available now",
    learners: 126,
    tags: ["Projects", "AI", "Beginner Friendly"],
    bookmarked: true,
    type: "teach",
  },
  {
    id: "react-pro",
    name: "React",
    category: "Programming",
    description: "Ship modern frontend interfaces with patterns used in hackathons and startups.",
    teacherId: "rahul",
    level: "Advanced",
    availability: "Weekends",
    learners: 94,
    tags: ["Hooks", "UI Systems", "Frontend"],
    type: "teach",
  },
  {
    id: "arduino-lab",
    name: "Arduino",
    category: "Electronics",
    description: "Build sensor-driven prototypes and understand embedded thinking from day one.",
    teacherId: "arjun",
    level: "Intermediate",
    availability: "Evenings",
    learners: 58,
    tags: ["IoT", "Robotics", "Hardware"],
    type: "teach",
  },
  {
    id: "ui-ux-core",
    name: "UI/UX",
    category: "Design",
    description: "Create sharper product flows, stronger visual hierarchy, and cleaner design decisions.",
    teacherId: "arjun",
    level: "Beginner",
    availability: "Flexible",
    learners: 74,
    tags: ["Figma", "Product", "Design Systems"],
    type: "teach",
  },
  {
    id: "photo-story",
    name: "Photography",
    category: "Photography",
    description: "Learn composition, editing, and visual storytelling for campus life and portfolios.",
    teacherId: "sarah",
    level: "Beginner",
    availability: "Weekends",
    learners: 32,
    tags: ["Editing", "Portraits", "Storytelling"],
    type: "teach",
  },
];

export const matches: Match[] = [
  {
    id: "m1",
    studentId: "rahul",
    score: 94,
    theyTeach: "Machine Learning",
    youTeach: "React",
    note: "Perfect skill exchange opportunity.",
  },
  {
    id: "m2",
    studentId: "sarah",
    score: 89,
    theyTeach: "Computer Vision",
    youTeach: "Arduino",
    note: "Strong overlap between your current skills and goals.",
  },
];

export const requests: RequestItem[] = [
  {
    id: "r1",
    studentId: "rahul",
    skill: "React",
    message: "I can help you go from UI fundamentals to hackathon-ready React architecture.",
    date: "Today",
    status: "Incoming",
    match: 94,
  },
  {
    id: "r2",
    studentId: "sarah",
    skill: "Python",
    message: "Would love to trade Python mentoring for help with product storytelling.",
    date: "Yesterday",
    status: "Sent",
    match: 89,
  },
  {
    id: "r3",
    studentId: "arjun",
    skill: "Arduino",
    message: "Let's turn your ML knowledge into an embedded build.",
    date: "Aug 10",
    status: "Active",
    match: 91,
  },
];

export const threads: MessageThread[] = [
  {
    id: "t1",
    studentId: "rahul",
    topic: "React ↔ Machine Learning",
    online: true,
    messages: [
      { id: "1", from: "them", text: "I mapped out a React session plan for Saturday.", time: "5:48 PM" },
      { id: "2", from: "me", text: "Perfect. I’ll bring a mini ML project we can swap on.", time: "5:51 PM" },
      { id: "3", from: "them", text: "Nice. Want me to tailor it around your dashboard idea?", time: "5:53 PM" },
    ],
  },
  {
    id: "t2",
    studentId: "sarah",
    topic: "Python ↔ Product Strategy",
    online: false,
    messages: [
      { id: "1", from: "them", text: "Sent over the dataset we can use for tomorrow’s session.", time: "Yesterday" },
    ],
  },
];
