import { Input, Button, Typography } from "@material-tailwind/react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { FcGoogle } from "react-icons/fc";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../firebase/config";

export function SignUp() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("signup");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const { name, email, password, confirmPassword } = formData;
      if (!name || !email || !password || !confirmPassword) {
        setError("All fields are required");
        setIsLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match");
        setIsLoading(false);
        return;
      }

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, confirmPassword }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      toast.success("OTP sent successfully. Please check your email.");
      setStep("verify");
    } catch (err) {
      console.error(err);
      setError(err.message || "Signup failed");
      toast.error(err.message || "Signup failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, otp }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      toast.success("Email verified successfully! You can now login.");
      navigate("/sign-in");
    } catch (err) {
      console.error(err);
      setError(err.message || "OTP verification failed");
      toast.error(err.message || "OTP verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  const googleProvider = new GoogleAuthProvider();
  const handleGoogleSignUp = async () => {
    try {
      setIsLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/google-signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: user.displayName,
          email: user.email,
          firebaseUid: user.uid,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("token", user.accessToken || "mock-jwt-token");
      toast.success("Signed in with Google successfully!");
      navigate("/preorder");
    } catch (err) {
      console.error(err);
      setError(err.message || "Google sign-in failed");
      toast.error(err.message || "Google sign-in failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="min-h-screen flex flex-col lg:flex-row items-center justify-center px-4 lg:px-16 py-10 gap-10 bg-gray-50">
      {/* Left Image */}
      <div className="hidden lg:flex lg:w-2/5 h-full">
        <img
          src="/img/Tastoria.jpg"
          className="h-full w-full object-cover rounded-3xl shadow-lg"
          alt="Tastoria"
        />
      </div>

      {/* Form Section */}
      <div className="w-full lg:w-3/5 flex flex-col items-center justify-center">
        <div className="text-center mb-6">
          <Typography variant="h2" className="font-bold mb-2">
            Join Us
          </Typography>
          <Typography variant="paragraph" color="blue-gray" className="text-lg font-normal">
            {step === "signup"
              ? "Enter your details to register."
              : "Enter the OTP sent to your email."}
          </Typography>
        </div>

        {error && <div className="mb-4 w-full max-w-md p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>}

        {step === "signup" ? (
          <form
            className="flex flex-col gap-4 w-full max-w-md"
            onSubmit={handleSignup}
          >
            <Input size="lg" label="Name" name="name" value={formData.name} onChange={handleInputChange} />
            <Input size="lg" label="Email" name="email" type="email" value={formData.email} onChange={handleInputChange} />
            <Input type="password" size="lg" label="Password" name="password" value={formData.password} onChange={handleInputChange} />
            <Input type="password" size="lg" label="Confirm Password" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} />
            <Button type="submit" fullWidth className="mt-4" disabled={isLoading}>
              {isLoading ? "Processing..." : "Create Account"}
            </Button>
          </form>
        ) : (
          <form className="flex flex-col gap-4 w-full max-w-md" onSubmit={handleVerifyOtp}>
            <Input size="lg" label="Enter OTP" value={otp} onChange={(e) => setOtp(e.target.value)} />
            <Button type="submit" fullWidth className="mt-4" disabled={isLoading}>
              {isLoading ? "Verifying..." : "Verify OTP"}
            </Button>
          </form>
        )}

        <button
          onClick={handleGoogleSignUp}
          className="flex items-center justify-center gap-2 w-full max-w-md mt-6 px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg shadow hover:bg-gray-50 transition"
        >
          <FcGoogle className="w-5 h-5" /> Continue with Google
        </button>

        <Typography variant="paragraph" className="text-center text-blue-gray-500 font-medium mt-4">
          Already have an account? <Link to="/sign-in" className="text-gray-900 ml-1">Sign in</Link>
        </Typography>
      </div>
    </section>
  );
}

export default SignUp;
