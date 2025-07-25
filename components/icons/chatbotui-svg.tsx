import { FC, useEffect, useState } from "react"

interface ChatbotUISVGProps {
  theme: "dark" | "light"
  scale?: number
}

export const ChatbotUISVG: FC<ChatbotUISVGProps> = ({ theme, scale = 1 }) => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <svg
      width={189 * scale}
      height={194 * scale}
      viewBox="0 0 189 194"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="12.5"
        y="12.5"
        width="164"
        height="127"
        rx="37.5"
        fill={theme === "dark" ? "#000" : "#fff"}
        stroke={theme === "dark" ? "#fff" : "#000"}
        strokeWidth="25"
      />
      <path
        d="M72.7643 143.457C77.2953 143.443 79.508 148.98 76.2146 152.092L42.7738 183.69C39.5361 186.749 34.2157 184.366 34.3419 179.914L35.2341 148.422C35.3106 145.723 37.5158 143.572 40.2158 143.564L72.7643 143.457Z"
        fill={theme === "dark" ? "#fff" : "#000"}
      />
      <path
        d="M59.6722 51.6H75.5122V84C75.5122 86.016 76.0162 87.672 77.0242 88.968C78.0802 90.216 79.6882 90.84 81.8482 90.84C84.0082 90.84 85.5922 90.216 86.6002 88.968C87.6562 87.672 88.1842 86.016 88.1842 84V51.6H104.024V85.44C104.024 89.04 103.424 92.088 102.224 94.584C101.072 97.032 99.4642 99.024 97.4002 100.56C95.3362 102.048 92.9602 103.128 90.2722 103.8C87.6322 104.52 84.8242 104.88 81.8482 104.88C78.8722 104.88 76.0402 104.52 73.3522 103.8C70.7122 103.128 68.3602 102.048 66.2962 100.56C64.2322 99.024 62.6002 97.032 61.4002 94.584C60.2482 92.088 59.6722 89.04 59.6722 85.44V51.6ZM113.751 51.6H129.951V102H113.751V51.6Z"
        fill={theme === "dark" ? "#fff" : "#000"}
      />
    </svg>
  )
}
