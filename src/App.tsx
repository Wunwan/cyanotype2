import { AnimatePresence } from 'framer-motion';
import { Route, Routes, useLocation } from 'react-router-dom';
import PhoneFrame from './components/PhoneFrame';
import Screen from './components/Screen';
import { ROUTES } from './lib/flow';

import Landing from './screens/Landing';
import Upload from './screens/Upload';
import Preview from './screens/Preview';
import Negative from './screens/Negative';
import Coat from './screens/Coat';
import Darkroom from './screens/Darkroom';
import Process from './screens/Process';
import Done from './screens/Done';
import Memory from './screens/Memory';
import ImagePreview from './screens/ImagePreview';

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path={ROUTES.landing} element={<Screen><Landing /></Screen>} />
        <Route path={ROUTES.upload} element={<Screen><Upload /></Screen>} />
        <Route path={ROUTES.preview} element={<Screen><Preview /></Screen>} />
        <Route path={ROUTES.negative} element={<Screen><Negative /></Screen>} />
        <Route path={ROUTES.coat} element={<Screen><Coat /></Screen>} />
        <Route path={ROUTES.darkroom} element={<Screen><Darkroom /></Screen>} />
        <Route path={ROUTES.process} element={<Screen><Process /></Screen>} />
        <Route path={ROUTES.done} element={<Screen scrollable><Done /></Screen>} />
        <Route path={ROUTES.memory} element={<Screen><Memory /></Screen>} />
        <Route path={ROUTES.imagePreview} element={<Screen><ImagePreview /></Screen>} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <>
      {/* Hand-drawn brush-stroke wobble used by pill-button strokes.
          turbulence + 4 octaves + scale=9 → irregular, organic brush edge. */}
      <svg width="0" height="0" className="absolute" aria-hidden focusable="false">
        <filter id="ink-wobble" x="-30%" y="-30%" width="160%" height="160%">
          <feTurbulence
            type="turbulence"
            baseFrequency="0.016 0.022"
            numOctaves="4"
            seed="11"
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="9"
            xChannelSelector="R"
            yChannelSelector="G"
            result="displaced"
          />
          <feGaussianBlur in="displaced" stdDeviation="0.35" />
        </filter>
      </svg>
      <PhoneFrame>
        <AnimatedRoutes />
      </PhoneFrame>
    </>
  );
}
