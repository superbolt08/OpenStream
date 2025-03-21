"use client"
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push("/chat");
  }, [router]);

  return (
    <div>
      <h1>Hello world</h1>
      <p>This is content to make our page longer</p>
      <p>Lorem Ipsum is simply dummy text ...</p>
    </div>
  );
}
