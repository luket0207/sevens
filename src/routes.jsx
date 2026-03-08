import { Routes, Route, Navigate } from "react-router-dom";

import Home from "./game/home/home";
import CareerStart from "./game/careerStart/careerStart";
import CareerGenerationLoading from "./game/careerGeneration/careerGenerationLoading";
import CareerHome from "./game/careerHome/careerHome";
import TeamManagement from "./game/teamManagement/teamManagement";
import Staff from "./game/staff/staff";
import Scouting from "./game/scouting/scouting";
import Training from "./game/training/training";
import CupDraw from "./game/cupDraw/cupDraw";
import PreMatch from "./game/preMatch/preMatch";
import Match from "./game/match/match";
import PostMatch from "./game/postMatch/postMatch";

const NotFound = () => <div>404</div>;

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/career/start" element={<CareerStart />} />
      <Route path="/career/generating" element={<CareerGenerationLoading />} />
      <Route path="/career/home" element={<CareerHome />} />
      <Route path="/team-management" element={<TeamManagement />} />
      <Route path="/staff" element={<Staff />} />
      <Route path="/scouting" element={<Scouting />} />
      <Route path="/training" element={<Training />} />
      <Route path="/cup-draw" element={<CupDraw />} />
      <Route path="/pre-match" element={<PreMatch />} />
      <Route path="/match" element={<Match />} />
      <Route path="/post-match" element={<PostMatch />} />

      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
}
