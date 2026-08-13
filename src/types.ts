export type Category =
  | "Programming"
  | "AI & ML"
  | "Electronics"
  | "Design"
  | "Business"
  | "Languages"
  | "Music"
  | "Photography"
  | "Academics";

export type Availability = "Available now" | "Evenings" | "Weekends" | "Flexible";

export type Level = "Beginner" | "Intermediate" | "Advanced";

export interface Review {
  author: string;
  rating: number;
  text: string;
}

export interface Project {
  title: string;
  description: string;
  technologies: string[];
}

export interface Student {
  id: string;
  name: string;
  headline: string;
  location: string;
  college: string;
  year: string;
  rating: number;
  responseRate: string;
  availability: Availability;
  avatar: string;
  about: string;
  teachSkills: string[];
  learnSkills: string[];
  projects: Project[];
  reviews: Review[];
  reputation: {
    xp: number;
    level: number;
    title: string;
  };
  isCurrentUser?: boolean;
}

export interface Skill {
  id: string;
  name: string;
  category: Category;
  description: string;
  teacherId: string;
  level: Level;
  availability: Availability;
  learners: number;
  tags: string[];
  bookmarked?: boolean;
  type: "teach" | "learn";
  createdAt?: any;
  updatedAt?: any;
}

export interface Match {
  id: string;
  studentId: string;
  score: number;
  theyTeach: string;
  youTeach: string;
  note: string;
}

export interface RequestItem {
  id: string;
  studentId: string;
  skill: string;
  message: string;
  date: string;
  status: "Incoming" | "Sent" | "Active" | "Completed" | "Rejected";
  match: number;
}

export interface MessageThread {
  id: string;
  studentId: string;
  topic: string;
  online: boolean;
  messages: {
    id: string;
    from: "me" | "them";
    text: string;
    time: string;
  }[];
}
