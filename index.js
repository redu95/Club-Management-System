// Add JavaScript to handle button clicks
document.getElementById("loginForm").addEventListener("submit", function (event) {
    event.preventDefault(); // Prevent form submission to handle it manually
    // Add logic to show/hide divs based on user role
    if ("<%= user.role %>" === "admin") {
        document.getElementById("adminContent").style.display = "block";
    } else if ("<%= user.role %>" === "member") {
        document.getElementById("memberContent").style.display = "block";
    }
});