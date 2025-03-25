import { createSession, deleteSession } from "@/app/lib/session";
import { redirect } from "next/navigation";

export async function signup(state: FormState, formData: FormData) {
  await createSession("testUser");
  redirect("/profile");
}

export async function logout() {
  deleteSession();
  redirect("/login");
}
