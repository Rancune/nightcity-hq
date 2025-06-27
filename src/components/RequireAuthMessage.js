import { SignedOut } from "@clerk/nextjs";

export default function RequireAuthMessage() {
  return (
    <SignedOut>
      <div style={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center"
      }}>
        <h2 style={{ color: "#0ff", fontSize: "2rem", marginBottom: "1rem" }}>
          Need to be connected to access
        </h2>
        <a
          href="https://accounts.fixer.rancune.games/sign-in"
          className="bg-[--color-neon-cyan] text-black font-bold py-3 px-5 rounded transition-all duration-200 hover:bg-white hover:text-background hover:shadow-[0_0_15px_var(--color-neon-cyan)] glitch-on-hover"
        >
          Se connecter
        </a>
      </div>
    </SignedOut>
  );
} 