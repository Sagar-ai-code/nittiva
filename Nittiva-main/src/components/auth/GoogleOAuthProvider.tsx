import { GoogleOAuthProvider } from '@react-oauth/google';

interface Props {
  children: React.ReactNode;
}

const GOOGLE_CLIENT_ID = "340205483530-brigdlaftvooc8m9hhee5seof2rnlj3i.apps.googleusercontent.com";

export function GoogleAuthProvider({ children }: Props) {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      {children}
    </GoogleOAuthProvider>
  );
}

