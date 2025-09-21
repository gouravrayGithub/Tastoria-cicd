import {
  Input,
  Button,
  Typography,
} from "@material-tailwind/react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { toast } from 'react-hot-toast';

export function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const auth = getAuth();

  const createAdminAccount = async () => {
    try {
      const adminEmail = "admin@tastoria.com";
      const adminPassword = "admin123";
      const result = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
      toast.success("Admin account created successfully! You can now login.");
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        toast("Admin account already exists. Please try logging in.");
      } else {
        toast.error(`Error creating admin account: ${error.message}`);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Only allow admin email
      if (email.toLowerCase() !== "admin@tastoria.com") {
        setError("Please use the administrator email address");
        setIsLoading(false);
        return;
      }

      const result = await signInWithEmailAndPassword(auth, email, password);
      // Store admin info
      localStorage.setItem('user', JSON.stringify({
        email: result.user.email,
        uid: result.user.uid,
        isAdmin: true
      }));
      localStorage.setItem('token', result.user.accessToken || 'mock-jwt-token');
      navigate('/admin-portal');
    } catch (error) {
      let errorMessage = "An error occurred during sign in";
      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          errorMessage = "Invalid administrator credentials";
          break;
        case 'auth/invalid-email':
          errorMessage = "Invalid email format";
          break;
        case 'auth/too-many-requests':
          errorMessage = "Too many attempts. Please try again later";
          break;
        default:
          errorMessage = error.message || "An error occurred during sign in";
      }
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="m-8 flex gap-4">
      <div className="w-full lg:w-3/5 mt-24">
        <div className="text-center">
          <Typography variant="h2" className="font-bold mb-4">Tastoria Admin Portal</Typography>
          <Typography variant="paragraph" color="blue-gray" className="text-lg font-normal">
            Enter your admin credentials to access the portal.
          </Typography>
        </div>

        <form className="mt-8 mb-2 mx-auto w-80 max-w-screen-lg lg:w-1/2" onSubmit={handleSubmit}>
          {error && (
            <Typography variant="small" color="red" className="mb-4 text-center">
              {error}
            </Typography>
          )}
          <div className="mb-1 flex flex-col gap-6">
            <Typography variant="small" color="blue-gray" className="-mb-3 font-medium">
              Admin Email
            </Typography>
            <Input
              size="lg"
              placeholder="admin@tastoria.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className=" !border-t-blue-gray-200 focus:!border-t-gray-900"
              labelProps={{
                className: "before:content-none after:content-none",
              }}
            />
            <Typography variant="small" color="blue-gray" className="-mb-3 font-medium">
              Password
            </Typography>
            <Input
              type="password"
              size="lg"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className=" !border-t-blue-gray-200 focus:!border-t-gray-900"
              labelProps={{
                className: "before:content-none after:content-none",
              }}
            />
          </div>
          <Button 
            className="mt-6" 
            fullWidth 
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? "Signing In..." : "Sign In as Admin"}
          </Button>
          <Button 
            className="mt-2" 
            fullWidth 
            variant="outlined"
            onClick={createAdminAccount}
          >
            Create Admin Account
          </Button>
          <Typography variant="paragraph" className="text-center text-blue-gray-500 font-medium mt-4">
            Not an admin?
            <Link to="/sign-in" className="text-gray-900 ml-1">Regular Sign In</Link>
          </Typography>
        </form>
      </div>
      <div className="w-2/5 h-full hidden lg:block">
        <img
          src="/img/Tastoria.jpg"
          className="h-full w-full object-cover rounded-3xl"
          alt="Tastoria Admin"
        />
      </div>
    </section>
  );
}

export default AdminLogin;