import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://todo-app.local';

function App() {
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({ title: '', description: '' });
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    if (token && userId) {
      setUser({ token, userId });
      fetchTasks(userId);
    }
  }, []);

  const fetchTasks = async (userId) => {
    try {
      const response = await axios.get(`${API_URL}/api/tasks`, {
        headers: { 'X-User-Id': userId }
      });
      setTasks(response.data);
    } catch (err) {
      console.error('Error fetching tasks:', err);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const response = await axios.post(`${API_URL}${endpoint}`, {
        username,
        password
      });
      
      if (isLogin) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userId', response.data.userId);
        setUser({ token: response.data.token, userId: response.data.userId });
        fetchTasks(response.data.userId);
      } else {
        setIsLogin(true);
        setError('Compte créé ! Connectez-vous maintenant.');
      }
      setUsername('');
      setPassword('');
    } catch (err) {
      setError(err.response?.data?.error || 'Une erreur est survenue');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    setUser(null);
    setTasks([]);
  };

  const addTask = async (e) => {
    e.preventDefault();
    if (!newTask.title) return;
    
    try {
      await axios.post(`${API_URL}/api/tasks`, newTask, {
        headers: { 'X-User-Id': user.userId }
      });
      setNewTask({ title: '', description: '' });
      fetchTasks(user.userId);
    } catch (err) {
      console.error('Error adding task:', err);
    }
  };

  const toggleTask = async (taskId, currentStatus) => {
    const newStatus = currentStatus === 'pending' ? 'completed' : 'pending';
    try {
      await axios.put(`${API_URL}/api/tasks/${taskId}`, 
        { status: newStatus },
        { headers: { 'X-User-Id': user.userId } }
      );
      fetchTasks(user.userId);
    } catch (err) {
      console.error('Error updating task:', err);
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await axios.delete(`${API_URL}/api/tasks/${taskId}`, {
        headers: { 'X-User-Id': user.userId }
      });
      fetchTasks(user.userId);
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  if (!user) {
    return (
      <div className="App">
        <div className="auth-container">
          <h1>odo App</h1>
          <h2>{isLogin ? 'Connexion' : 'Inscription'}</h2>
          {error && <div className={error.includes('créé') ? 'success' : 'error'}>{error}</div>}
          <form onSubmit={handleAuth}>
            <input
              type="text"
              placeholder="Nom d'utilisateur"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit">
              {isLogin ? 'Se connecter' : "S'inscrire"}
            </button>
          </form>
          <p>
            {isLogin ? "Pas encore de compte ? " : "Déjà un compte ? "}
            <span onClick={() => setIsLogin(!isLogin)} className="toggle-link">
              {isLogin ? "S'inscrire" : "Se connecter"}
            </span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <header>
        <h1>My Tasks</h1>
        <button onClick={handleLogout} className="logout-btn">Déconnexion</button>
      </header>

      <div className="container">
        <form onSubmit={addTask} className="add-task-form">
          <input
            type="text"
            placeholder="Titre de la tâche"
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Description (optionnel)"
            value={newTask.description}
            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
          />
          <button type="submit">Add</button>
        </form>

        <div className="tasks-list">
          {tasks.length === 0 ? (
            <p className="no-tasks">Aucune tâche. Ajoutez-en une !</p>
          ) : (
            tasks.map(task => (
              <div key={task.id} className={`task ${task.status}`}>
                <div className="task-content">
                  <h3 onClick={() => toggleTask(task.id, task.status)}>
                    {task.status === 'completed' ? 'Yes' : 'No'} {task.title}
                  </h3>
                  {task.description && <p>{task.description}</p>}
                  <small>{new Date(task.created_at).toLocaleDateString('fr-FR')}</small>
                </div>
                <button onClick={() => deleteTask(task.id)} className="delete-btn">
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default App;