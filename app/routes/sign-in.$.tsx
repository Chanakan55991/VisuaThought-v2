import { SignIn } from "@clerk/remix";

export default function SignInPage() {
  return (
    <div className="flex h-svh flex-col items-center justify-center">
      <h1 className="mb-4 text-2xl font-bold">Please Sign in here</h1>
      <SignIn />
    </div>
  );
}
