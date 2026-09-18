"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendVerification,
  signOut,
  mapAuthErrorToVietnamese,
  type User,
} from "@/lib/firebase";
import {
  Eye,
  EyeOff,
  Loader2,
  Mail,
  MailCheck,
  RefreshCw,
  Sparkles,
  Lock,
} from "lucide-react";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (user: User) => void;
  initialMode?: "signin" | "signup";
  reasonMessage?: string;
}

export function AuthModal({
  open,
  onOpenChange,
  onSuccess,
  initialMode = "signin",
  reasonMessage,
}: AuthModalProps) {
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successNotice, setSuccessNotice] = useState("");

  // Trạng thái chờ kích hoạt email
  const [isVerificationPending, setIsVerificationPending] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  // Đếm ngược cooldown gửi lại email
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleDialogChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      // Nếu đóng modal khi chưa hoàn tất xác thực email, đăng xuất để không giữ session ảo
      if (auth.currentUser && !auth.currentUser.emailVerified) {
        signOut(auth).catch(() => {});
      }
      setErrorMessage("");
      setSuccessNotice("");
      setIsVerificationPending(false);
      setMode(initialMode);
    }
    onOpenChange(nextOpen);
  };

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage("");
    setSuccessNotice("");

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage("Vui lòng nhập địa chỉ email.");
      return;
    }
    if (!password) {
      setErrorMessage("Vui lòng nhập mật khẩu.");
      return;
    }

    if (mode === "signup") {
      if (password.length < 6) {
        setErrorMessage("Mật khẩu phải có ít nhất 6 ký tự.");
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage("Mật khẩu xác nhận không khớp.");
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === "signup") {
        // 1. Đăng ký tài khoản mới qua Firebase
        const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        const user = cred.user;

        // 2. Gửi email xác thực tới hòm thư người dùng
        try {
          await sendVerification(user);
        } catch (sendErr) {
          console.warn("[Firebase Auth] Gửi email xác thực:", sendErr);
        }

        // 3. Chuyển sang giao diện thông báo kiểm tra email
        setUnverifiedEmail(cleanEmail);
        setIsVerificationPending(true);
        setResendCooldown(60);
      } else {
        // Đăng nhập tài khoản hiện có
        const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
        const user = cred.user;

        // Kiểm tra xem email đã được xác thực chưa
        if (!user.emailVerified) {
          setUnverifiedEmail(cleanEmail);
          setIsVerificationPending(true);
          setResendCooldown(30);
          setErrorMessage("Tài khoản chưa được kích hoạt email. Vui lòng kiểm tra hộp thư của bạn.");
          return;
        }

        onSuccess?.(user);
        onOpenChange(false);
      }
    } catch (err: unknown) {
      console.error("[Auth Error]:", err);
      const code = (err as { code?: string })?.code;
      setErrorMessage(mapAuthErrorToVietnamese(code));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleAuth() {
    setErrorMessage("");
    setSuccessNotice("");
    setLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      // Tài khoản Google mặc định được xác thực tự động bởi Google
      onSuccess?.(user);
      onOpenChange(false);
    } catch (err: unknown) {
      console.error("[Google Auth Error]:", err);
      const code = (err as { code?: string })?.code;
      setErrorMessage(mapAuthErrorToVietnamese(code));
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckVerification() {
    setLoading(true);
    setErrorMessage("");
    setSuccessNotice("");

    try {
      const current = auth.currentUser;
      if (!current) {
        setErrorMessage("Phiên đăng nhập đã hết hạn. Vui lòng bấm 'Quay lại đăng nhập'.");
        return;
      }

      // Làm mới token từ server Firebase để cập nhật trạng thái emailVerified
      await current.reload();
      const updated = auth.currentUser;

      if (updated && updated.emailVerified) {
        setSuccessNotice("Xác thực email thành công! Đang chuyển tiếp vào bài học...");
        setTimeout(() => {
          onSuccess?.(updated);
          onOpenChange(false);
        }, 1000);
      } else {
        setErrorMessage("Hệ thống chưa nhận được xác nhận từ email. Bạn vui lòng mở liên kết trong hộp thư nhé!");
      }
    } catch (err: unknown) {
      console.error("[Check Verification Error]:", err);
      setErrorMessage("Không thể kiểm tra lúc này. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResendEmail() {
    if (resendCooldown > 0) return;
    setLoading(true);
    setErrorMessage("");
    setSuccessNotice("");

    try {
      const current = auth.currentUser;
      if (current) {
        await sendVerification(current);
        setResendCooldown(60);
        setSuccessNotice("Đã gửi lại email xác thực! Vui lòng kiểm tra Hộp thư đến hoặc mục Thư rác (Spam).");
      } else {
        setErrorMessage("Không tìm thấy thông tin tài khoản. Vui lòng bấm 'Quay lại đăng nhập'.");
      }
    } catch (err: unknown) {
      console.error("[Resend Email Error]:", err);
      const code = (err as { code?: string })?.code;
      setErrorMessage(mapAuthErrorToVietnamese(code));
    } finally {
      setLoading(false);
    }
  }

  async function handleSwitchAccount() {
    try {
      await signOut(auth);
    } catch {
      // ignore
    }
    setIsVerificationPending(false);
    setMode("signin");
    setPassword("");
    setConfirmPassword("");
    setErrorMessage("");
    setSuccessNotice("");
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent
        className="max-w-[410px] rounded-2xl border border-zinc-200/80 bg-white p-6 sm:p-7 shadow-2xl shadow-zinc-950/10"
      >
        {/* ============================================================= */}
        {/* MÀN HÌNH CHỜ XÁC THỰC EMAIL                                  */}
        {/* ============================================================= */}
        {isVerificationPending ? (
          <div className="space-y-4 text-center pt-1">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-900 border border-zinc-200 shadow-xs">
              <MailCheck className="size-7 text-emerald-600 animate-pulse" />
            </div>

            <div>
              <DialogTitle className="text-xl font-bold tracking-tight text-zinc-900">
                Kiểm tra hộp thư của bạn
              </DialogTitle>
              <DialogDescription className="mt-2 text-xs leading-relaxed text-zinc-600">
                Chúng tôi đã gửi liên kết xác thực tới:
                <br />
                <span className="font-semibold text-zinc-900 text-sm mt-0.5 block">{unverifiedEmail}</span>
                <br />
                Vui lòng mở email và nhấn vào liên kết xác nhận để kích hoạt tài khoản của bạn.
              </DialogDescription>
            </div>

            <div className="rounded-xl border border-zinc-200/80 bg-zinc-50 p-3 text-left text-[11px] text-zinc-500 leading-relaxed">
              💡 <strong>Mẹo:</strong> Nếu không tìm thấy thư, vui lòng kiểm tra mục <strong>Thư rác (Spam)</strong> hoặc <strong>Quảng cáo</strong>.
            </div>

            {errorMessage && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-left text-xs font-medium text-red-700">
                ⚠️ {errorMessage}
              </div>
            )}

            {successNotice && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-2.5 text-left text-xs font-medium text-emerald-700">
                ✓ {successNotice}
              </div>
            )}

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleCheckVerification}
                disabled={loading}
                className="w-full rounded-xl bg-zinc-900 hover:bg-black py-2.5 text-xs font-semibold text-white shadow-sm transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="size-3.5" />
                )}
                Tôi đã bấm xác nhận trong email
              </button>

              <button
                type="button"
                onClick={handleResendEmail}
                disabled={loading || resendCooldown > 0}
                className="w-full rounded-xl border border-zinc-200 bg-white py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition disabled:opacity-40 cursor-pointer"
              >
                {resendCooldown > 0
                  ? `Gửi lại sau (${resendCooldown}s)`
                  : "Gửi lại email xác thực"}
              </button>

              <button
                type="button"
                onClick={handleSwitchAccount}
                className="text-xs text-zinc-500 hover:text-zinc-900 hover:underline pt-1 block mx-auto cursor-pointer"
              >
                ← Quay lại đăng nhập
              </button>
            </div>
          </div>
        ) : (
          /* ============================================================= */
          /* MÀN HÌNH FORM ĐĂNG NHẬP / ĐĂNG KÝ (MODERN SAAS DESIGN)        */
          /* ============================================================= */
          <div className="space-y-4">
            <DialogHeader className="text-center sm:text-center">
              <div className="mx-auto flex size-11 items-center justify-center rounded-2xl bg-zinc-900 text-white shadow-sm mb-1.5">
                <Sparkles className="size-5 text-emerald-400" />
              </div>
              <DialogTitle className="text-xl font-bold tracking-tight text-zinc-900">
                {mode === "signin" ? "Đăng nhập" : "Tạo tài khoản"}
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-500 mt-1 leading-relaxed">
                {reasonMessage ||
                  (mode === "signin"
                    ? "Đăng nhập để bắt đầu phiên học TeachBack cùng AI"
                    : "Đăng ký tài khoản để trải nghiệm học tập trọn vẹn")}
              </DialogDescription>
            </DialogHeader>

            {/* GOOGLE OAUTH CTA */}
            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-zinc-200 bg-white py-2.5 px-4 text-xs font-semibold text-zinc-700 shadow-xs transition hover:bg-zinc-50 hover:border-zinc-300 hover:text-zinc-900 disabled:opacity-50 cursor-pointer"
            >
              <svg className="size-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Tiếp tục với Google</span>
            </button>

            {/* DIVIDER */}
            <div className="relative my-2 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-200" />
              </div>
              <span className="relative bg-white px-2.5 text-[10px] font-medium uppercase tracking-wider text-zinc-400">
                hoặc tiếp tục với email
              </span>
            </div>

            {/* EMAIL / PASSWORD FORM */}
            <form onSubmit={handleEmailAuth} className="space-y-3 text-left">
              <div>
                <label className="text-[11px] font-medium text-zinc-700 block mb-1">
                  Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    disabled={loading}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 transition focus:bg-white focus:border-zinc-900 focus:outline-none"
                  />
                  <Mail className="size-3.5 text-zinc-400 absolute right-3 top-2.5 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-zinc-700 block mb-1">
                  Mật khẩu
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự"
                    required
                    disabled={loading}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 py-2 pr-9 text-xs text-zinc-900 placeholder:text-zinc-400 transition focus:bg-white focus:border-zinc-900 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2.5 top-2 text-zinc-400 hover:text-zinc-700 p-0.5"
                  >
                    {showPassword ? (
                      <EyeOff className="size-3.5" />
                    ) : (
                      <Eye className="size-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {mode === "signup" && (
                <div>
                  <label className="text-[11px] font-medium text-zinc-700 block mb-1">
                    Xác nhận mật khẩu
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu"
                      required
                      disabled={loading}
                      className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 py-2 pr-9 text-xs text-zinc-900 placeholder:text-zinc-400 transition focus:bg-white focus:border-zinc-900 focus:outline-none"
                    />
                    <Lock className="size-3.5 text-zinc-400 absolute right-3 top-2.5 pointer-events-none" />
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs font-medium text-red-700 flex items-start gap-1.5">
                  <span className="shrink-0 mt-0.5">⚠️</span>
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-zinc-900 hover:bg-black py-2.5 text-xs font-semibold text-white shadow-sm transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-1"
              >
                {loading && <Loader2 className="size-3.5 animate-spin" />}
                <span>{mode === "signin" ? "Đăng nhập" : "Tạo tài khoản"}</span>
              </button>

              {/* FOOTER SWITCH */}
              <div className="text-center pt-2">
                {mode === "signin" ? (
                  <p className="text-xs text-zinc-500">
                    Chưa có tài khoản?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setMode("signup");
                        setErrorMessage("");
                      }}
                      className="font-semibold text-zinc-900 hover:underline cursor-pointer"
                    >
                      Đăng ký ngay
                    </button>
                  </p>
                ) : (
                  <p className="text-xs text-zinc-500">
                    Đã có tài khoản?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setMode("signin");
                        setErrorMessage("");
                      }}
                      className="font-semibold text-zinc-900 hover:underline cursor-pointer"
                    >
                      Đăng nhập
                    </button>
                  </p>
                )}
              </div>

              <p className="text-[10px] text-zinc-400 text-center leading-relaxed pt-1">
                Bằng việc tiếp tục, bạn đồng ý với Điều khoản dịch vụ và Chính sách quyền riêng tư của TeachBack AI.
              </p>
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
