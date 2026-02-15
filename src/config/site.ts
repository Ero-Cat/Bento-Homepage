// ============================================================
// Site Configuration — Single Source of Truth
// ============================================================
// Edit this file to update all personal information on the homepage.
// No component code changes are needed.
// ============================================================

export interface SiteConfig {
    profile: {
        name: string;
        title: string;
        description: string;
        avatar: string;
        aliases?: string[];  // Typewriter cycling names
        location?: string;
    };
    interests: string[];
    hardware: {
        category: string;
        items: string[];
    }[];
    socialLinks: {
        platform: "github" | "telegram" | "discord" | "email" | "twitter" | "linkedin" | "youtube" | "bilibili" | "vrchat" | "steam" | "blog";
        url: string;
        enabled: boolean;
    }[];
    friends: {
        name: string;
        avatar: string;
        url: string;
        description?: string;
    }[];
    projects: {
        name: string;
        description: string;
        url: string;
        tags?: string[];
    }[];
    seo: {
        title: string;
        description: string;
        keywords: string[];
        ogImage?: string;
        siteUrl: string;
    };
    theme: {
        tintColor: string;
        tintColorRGB: string;
        gradientFrom: string;
        gradientVia: string;
        gradientTo: string;
    };
}

export const siteConfig: SiteConfig = {
    profile: {
        name: "EroCat",
        title: "Vibe Coding & Full-Stack Developer",
        description:
            "非常欢迎交流一些产品创意或用户角度上需求探讨。要永远对任何事物与逻辑抱有底层问题思考和吸收转化。带有批判性思维触及问题的核心。做爱做并且能持续满足自我的事情。",
        avatar: "/cat.png",
        aliases: ["EroCat", "DoKiDoKi", "大黄猫", "老王"],
        location: "China | VRChat",
    },

    interests: [
        "Vibe Coding",
        "DIY",
        "Spring Boot",
        "3D Print",
        "CS2",
        "VRChat",
        "Unity",
        "Minecraft",
        "OpenWrt",
        "Home Assistant",
        "QQ Bot",
        "ESXi Server",
    ],

    hardware: [
        { category: "🍎 Apple", items: ["MacBook Pro M5", "Mac Mini M2", "Air Pods 3 Pro", "iPhone 15 Pro (Europe)"] },
        { category: "🖥️ PC", items: ["R7-9800X3D", "RTX 3090 24G", "32GB DDR5", "ROG STRIX B650-A Gaming WIFI", "DELL R720XD Server | 100G | 22T"] },
        { category: "🥽⌨️ peripherals ", items: ["Quest 3", "HHKB", "NIZ PLUM", "Razer DeathAdder V3", "Logitech G502", "Logitech M720"] },
        { category: "🔨🎨 DIY", items: ["Xtool M1 Ultra", "Bambu Lab A1 AMS", "Bambu Lab A1 mini AMS", "EPSON L8058"] },
        { category: "🌐🛜 Network", items: ["GL·iNet AX1800", "GL·iNet MT3000", "N5105"] },
    ],

    socialLinks: [
        { platform: "github", url: "https://github.com/Ero-Cat", enabled: true },
        { platform: "telegram", url: "https://t.me/dokierocat", enabled: true },
        { platform: "blog", url: "https://blog.iacg.moe", enabled: true },

        { platform: "twitter", url: "https://x.com/DokiEroCat", enabled: true },
        { platform: "vrchat", url: "https://vrchat.com/home/user/usr_dcf7bc56-34d4-482a-b21f-fb2c05dcfb2f", enabled: true },
        { platform: "steam", url: "http://steamcommunity.com/id/233000", enabled: true },
        { platform: "discord", url: "https://discord.gg/erocat", enabled: false },
        { platform: "bilibili", url: "https://space.bilibili.com/791219", enabled: false },
        { platform: "email", url: "mailto:admin@iacg.moe", enabled: true },
    ],

    friends: [
        {
            name: "郭老师",
            avatar: "https://chaosgoo.com/images/Logo_Sketch.webp",
            url: "https://chaosgoo.com/",
            description: "郭老师 TQL",
        },
        {
            name: "荟荟",
            avatar: "https://nhui.top/content/uploadfile/202503/ad7b1741690461.jpg",
            url: "https://nhui.top/",
            description: "男科大糕手荟荟",
        },
        {
            name: "Lee",
            avatar: "https://leetfs.com/logo.png",
            url: "https://leetfs.com/",
            description: "木桶饭糕手李老板",
        },
        {
            name: "光水",
            avatar: "https://api.vrchat.cloud/api/1/file/file_c00911ce-3e53-4e98-a494-936811cc85a8/1/",
            url: "https://www.songzx.com/",
        },
        {
            name: "小路",
            avatar: "https://avatars.githubusercontent.com/u/8012410",
            url: "https://tun.cat",
        },
        {
            name: "Alumi",
            avatar: "https://lisek.cc/profile.png",
            url: "https://lisek.cc",
        },
    ],

    projects: [
        {
            name: "心率推送",
            description: "基于 Flutter 的跨平台 BLE 心率监控与推送工具，支持 HTTP/WS、OSC、MQTT 多协议实时推送，适用于 VRChat 模型联动。",
            url: "https://github.com/Ero-Cat/hr_push",
            tags: ["Flutter", "BLE", "OSC", "VRChat"],
        },
        {
            name: "Bento Homepage",
            description: "基于 Next.js 构建的 Bento Grid 风格个人主页，支持背景轮播、深色模式、响应式布局与一键部署至 GitHub Pages。",
            url: "https://github.com/Ero-Cat/bento-Homepage",
            tags: ["Next.js", "React", "TypeScript", "Bento Grid"],
        },
    ],

    seo: {
        title: "EroCat — 大黄猫个人首页",
        description:
            "EroCat（大黄猫）的个人主页 — Full-Stack Developer & Vibe Coder。热衷 Spring Boot、Unity、3D 打印、DIY、VRChat、Home Assistant 智能家居，以及各种折腾服务器与网络。欢迎交流产品创意与技术探讨。",
        keywords: [
            "EroCat", "大黄猫", "DoKiDoKi",
            "全栈开发", "Full-Stack Developer", "Vibe Coding",
            "Spring Boot", "Next.js", "React", "TypeScript",
            "Unity", "VRChat", "3D Print",
            "DIY", "Home Assistant", "OpenWrt", "ESXi",
            "个人主页", "portfolio",
        ],
        ogImage: "/og-image.png",
        siteUrl: "https://iacg.moe",
    },

    theme: {
        tintColor: "#fb7185",
        tintColorRGB: "251, 113, 133",
        gradientFrom: "#020617",
        gradientVia: "#0f172a",
        gradientTo: "#1e293b",
    },
};
