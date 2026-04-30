const state = {
  token: localStorage.getItem("token") || "",
  user: JSON.parse(localStorage.getItem("user") || "null"),
};

const statusOutput = document.getElementById("statusOutput");
const dashboardOutput = document.getElementById("dashboardOutput");
const projectsOutput = document.getElementById("projectsOutput");
const tasksOutput = document.getElementById("tasksOutput");

const toIsoFromLocal = (value) => (value ? new Date(value).toISOString() : null);

const setStatus = (message, payload) => {
  statusOutput.textContent = payload ? `${message}\n${JSON.stringify(payload, null, 2)}` : message;
};

const request = async (url, options = {}) => {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (state.token) {
    headers.Authorization = `Bearer ${state.token}`;
  }

  const response = await fetch(url, { ...options, headers });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
};

const saveAuth = (token, user) => {
  state.token = token;
  state.user = user;
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
};

const clearAuth = () => {
  state.token = "";
  state.user = null;
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

document.getElementById("signupBtn").addEventListener("click", async () => {
  try {
    const payload = {
      name: document.getElementById("name").value,
      email: document.getElementById("email").value,
      password: document.getElementById("password").value,
      role: document.getElementById("role").value,
    };
    const data = await request("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    saveAuth(data.token, data.user);
    setStatus("Signup successful", data.user);
  } catch (error) {
    setStatus(`Signup failed: ${error.message}`);
  }
});

document.getElementById("loginBtn").addEventListener("click", async () => {
  try {
    const payload = {
      email: document.getElementById("email").value,
      password: document.getElementById("password").value,
    };
    const data = await request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    saveAuth(data.token, data.user);
    setStatus("Login successful", data.user);
  } catch (error) {
    setStatus(`Login failed: ${error.message}`);
  }
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  clearAuth();
  setStatus("Logged out");
});

document.getElementById("refreshDashboardBtn").addEventListener("click", async () => {
  try {
    const data = await request("/api/dashboard");
    dashboardOutput.textContent = JSON.stringify(data, null, 2);
    setStatus("Dashboard loaded");
  } catch (error) {
    setStatus(`Dashboard failed: ${error.message}`);
  }
});

document.getElementById("createProjectBtn").addEventListener("click", async () => {
  try {
    const payload = {
      name: document.getElementById("projectName").value,
      description: document.getElementById("projectDescription").value,
    };
    const data = await request("/api/projects", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    setStatus("Project created", data);
  } catch (error) {
    setStatus(`Create project failed: ${error.message}`);
  }
});

document.getElementById("createTaskBtn").addEventListener("click", async () => {
  try {
    const payload = {
      title: document.getElementById("taskTitle").value,
      projectId: document.getElementById("taskProjectId").value,
      assigneeId: document.getElementById("taskAssigneeId").value || null,
      dueDate: toIsoFromLocal(document.getElementById("taskDueDate").value),
      status: document.getElementById("taskStatus").value,
    };
    const data = await request("/api/tasks", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    setStatus("Task created", data);
  } catch (error) {
    setStatus(`Create task failed: ${error.message}`);
  }
});

document.getElementById("loadProjectsBtn").addEventListener("click", async () => {
  try {
    const data = await request("/api/projects");
    projectsOutput.textContent = JSON.stringify(data, null, 2);
    setStatus("Projects loaded");
  } catch (error) {
    setStatus(`Load projects failed: ${error.message}`);
  }
});

document.getElementById("loadTasksBtn").addEventListener("click", async () => {
  try {
    const data = await request("/api/tasks");
    tasksOutput.textContent = JSON.stringify(data, null, 2);
    setStatus("Tasks loaded");
  } catch (error) {
    setStatus(`Load tasks failed: ${error.message}`);
  }
});

if (state.user) {
  setStatus(`Welcome back ${state.user.name} (${state.user.role})`);
}
