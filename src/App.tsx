import { HashRouter, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import ExercisesPage from './pages/ExercisesPage'
import WorkoutsPage from './pages/WorkoutsPage'
import WorkoutEditorPage from './pages/WorkoutEditorPage'
import ActiveSessionPage from './pages/ActiveSessionPage'
import HistoryPage from './pages/HistoryPage'
import SessionDetailPage from './pages/SessionDetailPage'
import ProgressPage from './pages/ProgressPage'
import AssistantPage from './pages/AssistantPage'
import SettingsPage from './pages/SettingsPage'
import { ensureDefaultExercises } from './db/ensureDefaults'
import BodyPage from './pages/BodyPage'
import PlatesPage from './pages/PlatesPage'
import CalculatorsPage from './pages/CalculatorsPage'
import PlanPage from './pages/PlanPage'
import Tutorial from './components/Tutorial'
import VolumePage from './pages/VolumePage'
import AiWorkoutPage from './pages/AiWorkoutPage'
import NutritionPage from './pages/NutritionPage'
import CharacterPage from './pages/CharacterPage'
import GamePage from './pages/GamePage'
import ShopPage from './pages/ShopPage'

ensureDefaultExercises()

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<WorkoutsPage />} />
          <Route path="/treinos/novo" element={<WorkoutEditorPage />} />
          <Route path="/treino-ia" element={<AiWorkoutPage />} />
          <Route path="/treinos/:id" element={<WorkoutEditorPage />} />
          <Route path="/sessao" element={<ActiveSessionPage />} />
          <Route path="/exercicios" element={<ExercisesPage />} />
          <Route path="/historico" element={<HistoryPage />} />
          <Route path="/historico/:id" element={<SessionDetailPage />} />
          <Route path="/progresso" element={<ProgressPage />} />
          <Route path="/progresso" element={<ProgressPage />} />
          <Route path="/progresso/corpo" element={<BodyPage />} />
          <Route path="/progresso/volume" element={<VolumePage />} />
          <Route path="/assistente" element={<AssistantPage />} />
          <Route path="/ajustes" element={<SettingsPage />} />
          <Route path="/anilhas" element={<PlatesPage />} />
          <Route path="/calculadoras" element={<CalculatorsPage />} />
          <Route path="/plano" element={<PlanPage />} />
          <Route path="/dieta" element={<NutritionPage />} />
          <Route path="/personagem" element={<CharacterPage />} />
          <Route path="/aventura" element={<GamePage />} />
          <Route path="/loja" element={<ShopPage />} />
        </Route>
      </Routes>
      <Tutorial />
    </HashRouter>
  )
}

export default App