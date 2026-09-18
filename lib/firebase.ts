import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  type Auth,
  type User,
} from "firebase/auth";

function configuredValue(value: string | undefined, fallback: string): string {
  const normalized = value?.trim();
  if (
    !normalized ||
    normalized.startsWith("your_") ||
    normalized.includes("your_project_id")
  ) {
    return fallback;
  }
  return normalized;
}

const firebaseConfig = {
  apiKey: configuredValue(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    "AIzaSyCQjpH1Arbhty337gD1poNRgveBYssX6k0"
  ),
  authDomain: configuredValue(
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    "minihackathon-26c8d.firebaseapp.com"
  ),
  projectId: configuredValue(
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    "minihackathon-26c8d"
  ),
  storageBucket: configuredValue(
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    "minihackathon-26c8d.firebasestorage.app"
  ),
  messagingSenderId: configuredValue(
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    "791489591746"
  ),
  appId: configuredValue(
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    "1:791489591746:web:db43a735b456c932d87e5b"
  ),
  measurementId: configuredValue(
    process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
    "G-Q2HHD87LPJ"
  ),
};

export function getFirebaseApp(): FirebaseApp {
  if (getApps().length > 0) {
    return getApp();
  }
  return initializeApp(firebaseConfig);
}

export const auth: Auth = getAuth(getFirebaseApp());
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

/**
 * Gửi email xác thực tài khoản tới hòm thư Gmail của người dùng
 */
export async function sendVerification(user: User): Promise<void> {
  await sendEmailVerification(user, {
    url: typeof window !== "undefined" ? window.location.href : "http://localhost:5173/playground",
    handleCodeInApp: true,
  });
}

/**
 * Dịch các mã lỗi Firebase Auth sang Tiếng Việt thân thiện
 */
export function mapAuthErrorToVietnamese(code?: string): string {
  if (!code) return "Có lỗi xảy ra, vui lòng thử lại.";
  if (code.startsWith("auth/api-key-not-valid")) {
    return "Cấu hình Firebase chưa hợp lệ. Vui lòng liên hệ quản trị viên ứng dụng.";
  }
  switch (code) {
    case "auth/invalid-email":
      return "Địa chỉ email không đúng định dạng.";
    case "auth/user-not-found":
      return "Không tìm thấy tài khoản với email này.";
    case "auth/wrong-password":
      return "Mật khẩu không chính xác.";
    case "auth/invalid-credential":
      return "Email hoặc mật khẩu không chính xác.";
    case "auth/email-already-in-use":
      return "Email này đã được sử dụng. Vui lòng chuyển sang tab Đăng nhập.";
    case "auth/weak-password":
      return "Mật khẩu quá yếu (cần tối thiểu 6 ký tự).";
    case "auth/popup-closed-by-user":
      return "Bạn đã đóng cửa sổ đăng nhập Google.";
    case "auth/popup-blocked":
      return "Trình duyệt đã chặn popup đăng nhập Google. Vui lòng cho phép popup và thử lại.";
    case "auth/too-many-requests":
      return "Đã thử đăng nhập sai quá nhiều lần. Vui lòng chờ 1-2 phút rồi thử lại.";
    case "auth/network-request-failed":
      return "Không thể kết nối mạng. Vui lòng kiểm tra đường truyền Internet.";
    default:
      return `Lỗi xác thực: ${code.replace("auth/", "")}`;
  }
}

export {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  type User,
};

