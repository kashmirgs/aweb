import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout';
import { LoginPage, ChatPage, HomePage, AgentListPage, AgentEditPage, AgentCreatePage, ModelManagementPage, UserListPage, UserCreatePage, UserEditPage } from './pages';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="settings">
            <Route index element={<Navigate to="agents" replace />} />
            <Route path="agents" element={<AgentListPage />} />
            <Route path="agents/new" element={<AgentCreatePage />} />
            <Route path="agents/:id" element={<AgentEditPage />} />
            <Route path="users" element={<UserListPage />} />
            <Route path="users/new" element={<UserCreatePage />} />
            <Route path="users/:id" element={<UserEditPage />} />
            <Route path="models" element={<ModelManagementPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
