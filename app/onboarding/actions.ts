"use server";

import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export type OnboardingState = { error?: string };

export async function createFamily(
  _prevState: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect("/sign-in");
  }

  const familyName = String(formData.get("familyName") ?? "").trim();
  const kidNames = formData
    .getAll("kidName")
    .map((name) => String(name).trim())
    .filter((name) => name.length > 0);

  if (!familyName) {
    return { error: "Family name is required." };
  }

  if (kidNames.length === 0) {
    return { error: "Add at least one kid." };
  }

  try {
    await prisma.family.create({
      data: {
        email: user.email,
        name: familyName,
        children: {
          create: kidNames.map((name) => ({ name })),
        },
      },
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      // Family already exists for this email (e.g. double submit) — treat as done.
      redirect("/");
    }

    return {
      error: "Something went wrong creating your family. Please try again.",
    };
  }

  redirect("/");
}
