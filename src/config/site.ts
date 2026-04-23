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
        /** Keyed by language prefix: "zh", "en", "ja", etc. "en" is the fallback. */
        description: Record<string, string>;
        avatar: string;
        aliases?: string[];  // Typewriter cycling names
        location?: string;
    };
    interests: string[];
    hardware: {
        category: string;
        icon: string;   // Lucide icon name: "Apple", "Monitor", etc.
        items: string[];
    }[];
    software: {
        name: string;
        icon: string;   // filename = /icons/software/{name}.svg | URL = CDN | "" = letter fallback
    }[];
    socialLinks: {
        platform: "github" | "telegram" | "discord" | "email" | "twitter" | "linkedin" | "youtube" | "bilibili" | "vrchat" | "steam" | "blog" | "vrcx-cloud";
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
    netease?: {
        /** 网易云曲目列表，包含完整元数据（无需运行时 API 请求） */
        tracks: {
            songId: number;
            name: string;
            artist: string;
            album: string;
            albumCover: string;
            duration: number; // ms
        }[];
    };
    github?: {
        /** GitHub 用户名，用于贡献热力图 */
        username: string;
    };
    blog?: {
        /** 博客地址（Halo 2.x） */
        url: string;
        /** 显示最近几篇博文，默认 5 */
        size?: number;
    };
    vrchat?: {
        /** VRCX-Cloud API 地址 */
        apiBase: string;
        /** VRChat User ID */
        userId: string;
        /** Bio 展示行数，默认 3 */
        bioLines?: number;
    };
    map?: {
        /** Mapbox public access token (pk.xxx) */
        accessToken: string;
        /** Map center: [lng, lat] */
        center: [number, number];
        /** Initial zoom level (1-18) */
        zoom: number;
        /** City markers */
        markers: {
            name: string;
            coordinates: [number, number]; // [lng, lat]
            emoji?: string;
        }[];
    };
    weather?: {
        city: string;
        lat: number;
        lon: number;
    };
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
        description: {
            zh: "非常欢迎交流一些产品创意或用户角度上需求探讨。要永远对任何事物与逻辑抱有底层问题思考和吸收转化。带有批判性思维触及问题的核心。做爱做并且能持续满足自我的事情。",
            en: "Always open to discussing product ideas and exploring user-centric needs. Think critically, get to the core of every problem, and do what you love.",
            ja: "プロダクトのアイデアやユーザー視点のニーズについて、ぜひ交流しましょう。常に本質的な問い掛けを大切にしています。",
        },
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
        { category: "Apple", icon: "Apple", items: ["MacBook Pro M5", "Mac Mini M2", "Air Pods 3 Pro", "iPhone 15 Pro (Europe)"] },
        { category: "Desktop", icon: "Monitor", items: ["R7-9800X3D", "RTX 3090 24G", "32GB DDR5", "ROG STRIX B650-A Gaming WIFI", "DELL R720XD Server | 100G | 22T"] },
        { category: "Peripherals", icon: "Keyboard", items: ["Quest 3", "HHKB", "NIZ PLUM", "Razer DeathAdder V3", "Logitech G502", "Logitech M720"] },
        { category: "DIY & Maker", icon: "Printer", items: ["Xtool M1 Ultra", "Bambu Lab A1 AMS", "Bambu Lab A1 mini AMS", "EPSON L8058"] },
        { category: "Network", icon: "Wifi", items: ["GL·iNet AX1800", "GL·iNet MT3000", "N5105"] },
    ],


    software: [
        // IDE & Game Engine
        { name: "VS Code", icon: "vscode" },
        { name: "IntelliJ IDEA", icon: "intellij" },
        { name: "Unity", icon: "unity" },

        // AI & Productivity
        { name: "Antigravity", icon: "antigravity" },
        { name: "Codex", icon: "ChatGPT" },
        { name: "Notion", icon: "notion" },

        // DevOps & Terminal
        { name: "Docker", icon: "docker" },
        { name: "Homebrew", icon: "homebrew" },
        { name: "Tmux", icon: "tmux" },

        // Network & Proxy

        { name: "OpenVPN", icon: "OpenVPN" },
        { name: "Shadowsocks", icon: "Shadowsocks" },
        { name: "WireGuard", icon: "wireguard" },

        // Media
        { name: "网易云", icon: "netEase-cloud-music" },
    ],

    socialLinks: [
        { platform: "github", url: "https://github.com/Ero-Cat", enabled: true },
        { platform: "telegram", url: "https://t.me/dokierocat", enabled: true },
        { platform: "blog", url: "https://blog.iacg.moe", enabled: true },
        { platform: "vrcx-cloud", url: "http://vrcx-cloud.iacg.moe", enabled: true },
        { platform: "twitter", url: "https://x.com/DokiEroCat", enabled: true },
        { platform: "vrchat", url: "https://vrchat.com/home/user/usr_dcf7bc56-34d4-482a-b21f-fb2c05dcfb2f", enabled: true },
        { platform: "steam", url: "http://steamcommunity.com/id/233000", enabled: true },
        { platform: "discord", url: "https://discord.gg/erocat", enabled: false },
        { platform: "bilibili", url: "https://space.bilibili.com/791219", enabled: true },
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
            name: "李老板",
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
            description: "配置驱动的液态玻璃风格个人主页，集成网易云播放器、VRChat 实时状态、GitHub 热力图、3D Tilt 毛玻璃卡片、背景轮播、多头像轮播、多语言 i18n，支持 GitHub Pages 全静态部署。",
            url: "https://github.com/Ero-Cat/bento-Homepage",
            tags: ["Next.js", "React", "TypeScript", "Bento Grid"],
        },
    ],

    netease: {
        tracks: [
            {
                songId: 1814460094,
                name: "Waves That Sound Like You",
                artist: "BigRicePiano",
                album: "Waves That Sound Like You",
                albumCover: "https://p1.music.126.net/N_1k-mBbHtEXz0z9Bvipzg==/109951165656563230.jpg",
                duration: 0,
            },
            {
                songId: 1408944670,
                name: "The Sound of Rain",
                artist: "BigRicePiano",
                album: "The Sound of Rain",
                albumCover: "https://p2.music.126.net/6Uk3QRGKLaCTvfOFXDKyLQ==/109951165017760372.jpg",
                duration: 0,
            },
            {
                songId: 1854700148,
                name: "晚",
                artist: "柠安",
                album: "晚",
                albumCover: "https://p1.music.126.net/o3m413wu0IE6MMDHaPBbUA==/109951166102809451.jpg",
                duration: 0,
            },
        ],
    },

    github: {
        username: "Ero-Cat",
    },

    blog: {
        url: "https://blog.iacg.moe",
        size: 5,
    },

    vrchat: {
        apiBase: "https://vrcx-cloud.iacg.moe",
        userId: "usr_dcf7bc56-34d4-482a-b21f-fb2c05dcfb2f",
        bioLines: 5,
    },

    map: {
        accessToken: "pk.eyJ1IjoiaXRzLWVyaWMtd3UiLCJhIjoiY2x4cXhpcWN1MTVxNDJqcHhrYm90dDlucyJ9.QIpbRn1bfgW2wBRgI2uT9A",
        center: [118.0, 35.0],
        zoom: 3.5,
        markers: [
            { name: "上海", coordinates: [121.4737, 31.2304], emoji: "🌃" },
            { name: "婺源", coordinates: [117.8613, 29.2481], emoji: "🏡" },
            { name: "成都", coordinates: [104.0657, 30.5723], emoji: "🐼" },
            { name: "江西", coordinates: [115.8922, 28.6765], emoji: "🏔" },
            { name: "东京", coordinates: [139.6917, 35.6895], emoji: "🗼" },
            { name: "大阪", coordinates: [135.5023, 34.6937], emoji: "🏯" },
            { name: "京都", coordinates: [135.7681, 35.0116], emoji: "⛩️" },
            { name: "富士山", coordinates: [138.7274, 35.3606], emoji: "🗻" },
            { name: "黄山", coordinates: [118.1694, 30.1333], emoji: "⛰️" },
            { name: "镰仓", coordinates: [139.5467, 35.3192], emoji: "🌊" },
            { name: "合肥", coordinates: [117.2272, 31.8206], emoji: "🏙" },
            { name: "蚌埠", coordinates: [117.3890, 32.9160], emoji: "🚂" },
            { name: "呼和浩特", coordinates: [111.7510, 40.8424], emoji: "🐎" },
            { name: "通辽", coordinates: [122.2430, 43.6527], emoji: "🌾" },
            { name: "阜阳", coordinates: [115.8140, 32.8908], emoji: "🌻" },
            { name: "北京", coordinates: [116.4074, 39.9042], emoji: "🏛" },
            { name: "南京", coordinates: [118.7969, 32.0603], emoji: "🏯" },
        ],
    },

    weather: {
        city: "合肥",
        lat: 31.8206,
        lon: 117.2272,
    },

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
        ogImage: "/cat.png",
        siteUrl: "https://iacg.moe",
    },

    theme: {
        tintColor: "#ff375f",
        tintColorRGB: "255, 55, 95",
        gradientFrom: "#000000",
        gradientVia: "#090909",
        gradientTo: "#111116",
    },
};
