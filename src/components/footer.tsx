import { siteConfig } from "@/config/site";

export function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="relative z-10 py-8 text-center">
            <p className="text-xs text-text-tertiary">
                © {currentYear} {siteConfig.profile.name}
            </p>
        </footer>
    );
}
