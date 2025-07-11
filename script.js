const toggleBtn = document.getElementById("toggleMode");
const form = document.getElementById("searchForm");
const input = document.getElementById("usernameInput");
const errorMessage = document.getElementById("errorMessage");
const spinner = document.getElementById("spinner");
const profileContainer = document.getElementById("profileContainer");

toggleBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    toggleBtn.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";
});

form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = input.value.trim();
    if (!username) {
        errorMessage.textContent = "Please enter a GitHub username.";
        return;
    }

    errorMessage.textContent = "";
    profileContainer.innerHTML = "";
    spinner.style.display = "flex";

    try {
        const [userRes, reposRes] = await Promise.all([
            fetch(`https://api.github.com/users/${username}`),
            fetch(`https://api.github.com/users/${username}/repos`)
        ]);

        if (!userRes.ok) throw new Error("User not found");

        const user = await userRes.json();
        const repos = await reposRes.json();

        renderProfile(user, repos);
    } catch (err) {
        errorMessage.textContent = err.message;
    } finally {
        spinner.style.display = "none";
    }
});

function renderProfile(user, repos) {
    const joinedDate = new Date(user.created_at).toLocaleDateString();

    const languageCount = {};
    repos.forEach(repo => {
        if (repo.language) {
            languageCount[repo.language] = (languageCount[repo.language] || 0) + 1;
        }
    });

    const topLanguages = Object.entries(languageCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([lang]) => lang);

    const profileHTML = `
        <div class="profile-card">
          <img src="${user.avatar_url}" alt="${user.name || user.login}'s avatar">
          <div class="profile-info">
            <h2>${user.name || user.login}</h2>
            <p>${user.bio || "No bio available."}</p>
            <p>📍 ${user.location || "Location not specified"}</p>
            <p>Joined: ${joinedDate}</p>
            <div class="stats">
              <div class="stat"><strong>Repos</strong><br>${user.public_repos}</div>
              <div class="stat"><strong>Followers</strong><br>${user.followers}</div>
              <div class="stat"><strong>Following</strong><br>${user.following}</div>
              <div class="stat"><strong>Gists</strong><br>${user.public_gists}</div>
            </div>
          </div>
        </div>

        <div class="skills">
          <h3>Skills</h3>
          <div class="skill-badges">
            ${topLanguages.map(lang => `<span class="badge">${lang}</span>`).join("") || "<p>No skills detected</p>"}
          </div>
        </div>

        <div class="repos">
          <h3>Public Repositories</h3>
          <div class="repo-list">
            ${repos
            .slice(0, 20)
            .map(repo => `
                <div class="repo">
                  <h4><a href="${repo.html_url}" target="_blank">${repo.name}</a></h4>
                  <p>${repo.description || "No description"}</p>
                  <p>⭐ ${repo.stargazers_count} | 🍴 ${repo.forks_count} | ${repo.language || "Unknown"}</p>
                </div>
              `)
            .join("")}
          </div>
        </div>
      `;

    profileContainer.innerHTML = profileHTML;
}