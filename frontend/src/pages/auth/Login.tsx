import { login } from "@/utils/auth";
import { Checkbox, Input, type CheckboxChangeEvent } from "antd";
import { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import logoApp from "@/assets/logoApp.png";

function Login() {
  // STATE MANAGEMENT
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    remember: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  // STATE MANAGEMENT END

  const navigate = useNavigate();

  // FUNCTION
  const handleInputChange = (field: "email" | "password", value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleRememberChange = (e: CheckboxChangeEvent) => {
    // Ubah tipe parameter
    setFormData((prev) => ({ ...prev, remember: e.target.checked }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formData.email || !formData.password) {
      toast.error("Email dan password wajib diisi.");
      return;
    }

    const toastId = toast.loading("Memproses login..."); // Tampilkan loading toast
    setIsSubmitting(true);

    try {
      const encodedEmail = btoa(formData.email);
      const encodedPassword = btoa(formData.password);

      const response = await login({
        email: encodedEmail,
        password: encodedPassword,
        remember: formData.remember,
      });

      if (response.success) {
        toast.success("Login berhasil!", { id: toastId }); // Update ke success
        setIsSubmitting(false);
        navigate("/app", { replace: true });
      } else {
        setIsSubmitting(false);
        toast.error(response.message || "Login failed", { id: toastId }); // Update ke error
      }
    } catch (error) {
      setIsSubmitting(false);
      const message =
        error instanceof Error
          ? error.message
          : "Login gagal. Silakan coba lagi.";
      toast.error(message, { id: toastId }); // Update ke error
    }
  };
  // FUNCTION END

  return (
    <div className="bg-linear-to-br from-background to-white min-h-screen flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg w-[80%] max-w-md">
        <div className="mb-4">
          <img src={logoApp} alt="Logo" className="mx-auto w-24 h-24" />
          <h2 className="text-2xl md:text-4xl mb-2 font-medium text-slate-900 text-center">
            Welcome Back
          </h2>
          <p className="text-center text-slate-600 leading-5 text-sm md:text-base">
            Happy to see you again👋🏼 <br /> Login to your account bellow
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4! ">
          <Input
            type="email"
            placeholder="Email"
            size="large"
            autoComplete="email"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            className="w-full p-2 border border-gray-300 rounded hover:border-primary-500! focus:border-primary-500!"
            disabled={isSubmitting}
          />
          <Input
            type="password"
            size="large"
            placeholder="Password"
            autoComplete="current-password"
            value={formData.password}
            onChange={(e) => handleInputChange("password", e.target.value)}
            className="w-full p-2 border border-gray-300 rounded hover:border-primary-500! focus:borprimary-500mary!"
            disabled={isSubmitting}
          />

          <div className="flex items-center justify-between">
            <Checkbox
              checked={formData.remember}
              onChange={handleRememberChange}
              className="text-sm text-slate-600"
            >
              Remember me
            </Checkbox>
          </div>

          <button
            type="submit"
            disabled={
              isSubmitting ||
              !formData.email.trim() ||
              !formData.password.trim()
            }
            className="w-full bg-primary-500 text-white py-2 rounded hoverprimary-500mary/80 cursor-pointer transition-colors disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#b3a0fc]"
          >
            {isSubmitting ? "Memproses..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
