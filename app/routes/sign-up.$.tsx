import { SignUp } from "@clerk/remix";

export default function SignUpPage() {
  return (
    <div className="flex h-svh items-center justify-center">
      <h1>Sign Up</h1>
      <SignUp />
    </div>
  );
}
