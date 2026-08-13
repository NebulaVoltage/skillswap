import { chromium } from "playwright";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const email = `skillswap.test.${Date.now()}@example.com`;
const password = "SkillSwap123!";
const updatedCollege = "Updated SkillSwap Institute";

const app = initializeApp(firebaseConfig, `test-run-${Date.now()}`);
const auth = getAuth(app);
const db = getFirestore(app);

const result = {
  date: "2026-08-13",
  email,
  auth: {
    signUp: "FAIL",
    signIn: "FAIL",
    signOut: "FAIL",
    persistence: "FAIL",
  },
  firestore: {
    userCreation: "FAIL",
    profileLoading: "FAIL",
    profileUpdate: "FAIL",
  },
  routing: {
    protectedRoutes: "FAIL",
  },
  user: {
    uid: null,
    initialProfile: null,
    updatedProfile: null,
  },
  errors: [],
  browserConsole: [],
};

const browser = await chromium.launch({
  headless: true,
  executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
});

const context = await browser.newContext();
const page = await context.newPage();

page.on("console", (message) => {
  result.browserConsole.push(`[${message.type()}] ${message.text()}`);
});

page.on("pageerror", (error) => {
  result.errors.push(`pageerror: ${error.message}`);
});

page.on("requestfailed", (request) => {
  result.errors.push(`requestfailed: ${request.url()} :: ${request.failure()?.errorText ?? "unknown"}`);
});

try {
  await page.goto("http://127.0.0.1:5173/sign-up", { waitUntil: "networkidle", timeout: 30000 });
  await page.getByLabel("Name").fill("SkillSwap Test User");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm Password").fill(password);
  await page.getByLabel("College").fill("SkillSwap Test College");
  await page.getByLabel("Year").fill("3rd Year");
  await page.getByRole("button", { name: "Create Account" }).click();
  await page.waitForURL("**/dashboard", { timeout: 30000 });
  await page.getByText("Good afternoon, SkillSwap Test User").waitFor({ timeout: 10000 });
  result.auth.signUp = "PASS";
  result.firestore.profileLoading = "PASS";

  const credential = await signInWithEmailAndPassword(auth, email, password);
  result.user.uid = credential.user.uid;

  const createdDoc = await getDoc(doc(db, "users", credential.user.uid));
  if (createdDoc.exists()) {
    result.firestore.userCreation = "PASS";
    result.user.initialProfile = createdDoc.data();
  }

  await page.reload({ waitUntil: "networkidle" });
  await page.waitForURL("**/dashboard", { timeout: 30000 });
  await page.getByText("Good afternoon, SkillSwap Test User").waitFor({ timeout: 10000 });
  result.auth.persistence = "PASS";

  await page.goto("http://127.0.0.1:5173/profile", { waitUntil: "networkidle", timeout: 30000 });
  await page.getByLabel("College").fill(updatedCollege);
  await page.getByRole("button", { name: "Save Profile" }).click();
  await page.getByText("Profile saved successfully.").waitFor({ timeout: 10000 });
  await page.reload({ waitUntil: "networkidle" });
  await page.getByDisplayValue(updatedCollege).waitFor({ timeout: 10000 });

  const updatedDoc = await getDoc(doc(db, "users", credential.user.uid));
  if (updatedDoc.exists() && updatedDoc.data().college === updatedCollege) {
    result.firestore.profileUpdate = "PASS";
    result.user.updatedProfile = updatedDoc.data();
  }

  await page.getByRole("button", { name: /Sign Out/i }).click();
  await page.waitForURL("**/sign-in", { timeout: 15000 });
  result.auth.signOut = "PASS";

  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.waitForURL("**/dashboard", { timeout: 30000 });
  await page.getByText("Good afternoon, SkillSwap Test User").waitFor({ timeout: 10000 });
  result.auth.signIn = "PASS";

  await page.getByRole("button", { name: /Sign Out/i }).click();
  await page.waitForURL("**/sign-in", { timeout: 15000 });
  await page.goto("http://127.0.0.1:5173/dashboard", { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForURL("**/sign-in", { timeout: 15000 });
  result.routing.protectedRoutes = "PASS";
} catch (error) {
  result.errors.push(error instanceof Error ? error.stack ?? error.message : String(error));
}

await browser.close();

console.log(JSON.stringify(result, null, 2));
