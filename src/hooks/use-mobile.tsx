
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(false)

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    
    // Initial check
    checkMobile()
    
    // Setup listener
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    if (mql.addEventListener) {
      mql.addEventListener("change", checkMobile)
    } else {
      // Fallback for older browsers
      window.addEventListener('resize', checkMobile)
    }
    
    return () => {
      if (mql.removeEventListener) {
        mql.removeEventListener("change", checkMobile)
      } else {
        window.removeEventListener('resize', checkMobile)
      }
    }
  }, [])

  return isMobile
}
