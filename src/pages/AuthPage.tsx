import { useState } from "react";
import LoginPage from "./LoginPage";
import SignupPage from "./SignupPage";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  return isLogin
    ? <LoginPage onToggle={() => setIsLogin(false)} />
    : <SignupPage onToggle={() => setIsLogin(true)} />;
}
