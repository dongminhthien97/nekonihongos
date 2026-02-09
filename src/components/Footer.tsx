export function Footer() {
  const catImages = [
    "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Yuumi_0.jpg",
    "https://wiki.leagueoflegends.com/en-us/images/thumb/Yuumi_BattlePrincipalSkin.jpg/340px-Yuumi_BattlePrincipalSkin.jpg?5d070",
    "https://wiki.leagueoflegends.com/en-us/images/thumb/Yuumi_YuubeeSkin.jpg/340px-Yuumi_YuubeeSkin.jpg?250dd",
    "https://wiki.leagueoflegends.com/en-us/images/thumb/Yuumi_ShibaSkin.jpg/340px-Yuumi_ShibaSkin.jpg?dc19c",
    "https://wiki.leagueoflegends.com/en-us/images/thumb/Yuumi_CyberCatSkin.jpg/340px-Yuumi_CyberCatSkin.jpg?03976",
    "https://wiki.leagueoflegends.com/en-us/images/thumb/Yuumi_NightbringerSkin.jpg/340px-Yuumi_NightbringerSkin.jpg?5e09c",
    "https://wiki.leagueoflegends.com/en-us/images/thumb/Yuumi_BattlePrincipal_%28Base%29.png/183px-Yuumi_BattlePrincipal_%28Base%29.png?266ce",
    "https://wiki.leagueoflegends.com/en-us/images/thumb/Yuumi_CyberCat_%28Base%29.png/183px-Yuumi_CyberCat_%28Base%29.png?b8289",
    "https://wiki.leagueoflegends.com/en-us/images/thumb/Yuumi_Nightbringer_%28Base%29.png/183px-Yuumi_Nightbringer_%28Base%29.png?cd44c",
    "https://wiki.leagueoflegends.com/en-us/images/thumb/Yuumi_Shiba_%28Base%29.png/183px-Yuumi_Shiba_%28Base%29.png?c8059",
    "https://wiki.leagueoflegends.com/en-us/images/thumb/Yuumi_HeartseekerSkin.jpg/340px-Yuumi_HeartseekerSkin.jpg?6b7cb",
    "https://wiki.leagueoflegends.com/en-us/images/thumb/Yuumi_BewitchingSkin.jpg/340px-Yuumi_BewitchingSkin.jpg?285ea",
    "https://wiki.leagueoflegends.com/en-us/images/thumb/Yuumi_EDGSkin.jpg/340px-Yuumi_EDGSkin.jpg?24c47",
    "https://wiki.leagueoflegends.com/en-us/images/thumb/Yuumi_Bewitching_%28Base%29.png/183px-Yuumi_Bewitching_%28Base%29.png?e91eb",
    "https://wiki.leagueoflegends.com/en-us/images/thumb/Yuumi_EDG_%28Base%29.png/183px-Yuumi_EDG_%28Base%29.png?56669",
    "https://wiki.leagueoflegends.com/en-us/images/thumb/Yuumi_Heartseeker_%28Base%29.png/183px-Yuumi_Heartseeker_%28Base%29.png?ecb84",
    "https://wiki.leagueoflegends.com/en-us/images/thumb/Yuumi_PrestigeCyberCatSkin.jpg/340px-Yuumi_PrestigeCyberCatSkin.jpg?b1c3a",
  ];

  return (
    <footer
      className="relative py-16 mt-20"
      style={{
        position: "fixed" /* 1. Fixed để dính đáy */,
        bottom: 0 /* 2. Dính sát đáy màn hình */,
        left: 0 /* 3. Từ mép trái */,
        width: "100%" /* 4. Full chiều ngang */,
        pointerEvents: "none" /* Không che nút bấm */,
      }}
    >
      {/* Nhiều mèo bay nhẹ nhàng từ trái → phải, ra khỏi màn hình thì quay lại */}
      <div className="absolute inset-0">
        {catImages.map((src, index) => (
          <div
            key={index}
            className="absolute"
            style={{
              top: `${20 + (index % 3) * 7}%`, // 3 hàng dọc nhẹ nhàng
              left: `-80px`, // bắt đầu ngoài màn hình bên trái
              animation: `floatRight 28s linear infinite`,
              animationDelay: `${index * 1.7}s`, // mỗi con cách nhau ~2.8s
            }}
          >
            <img
              src={src}
              alt="Neko"
              className="w-20 h-20 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-full object-cover shadow-xl border-4 border-white/90 hover:scale-110 transition-transform duration-300"
            />
          </div>
        ))}

        {/* Thêm vài bông hoa anh đào bay cùng cho đẹp */}
        {[...Array(6)].map((_, i) => (
          <div
            key={`sakura-${i}`}
            className="absolute text-4xl opacity-60"
            style={{
              top: `${15 + i * 12}%`,
              left: `-80px`,
              animation: `floatRight 32s linear infinite`,
              animationDelay: `${i * 4}s`,
            }}
          >
            🌸
          </div>
        ))}
      </div>

      {/* Animation: bay từ trái sang phải rồi lặp lại */}
      <style>{`
        @keyframes floatRight {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(calc(100vw + 200px));
          }
        }
      `}</style>
    </footer>
  );
}
