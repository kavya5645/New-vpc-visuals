# vpc-visual

An animated, beginner-friendly diagram that explains an **AWS VPC** step by step, in plain language anyone can follow. The story: a shop owner, Nagothi Kavya Sree, builds a gated housing society for her shop.

Plain HTML, CSS and JavaScript. No build step, no dependencies.

## Plain-language analogies

| Technical term | Analogy |
|---|---|
| VPC | Fenced plot |
| Subnet | Lobby (public) / flats (private) |
| Internet Gateway | Main gate |
| NAT Gateway | Delivery counter |
| Security Group | Door guard |
| NACL | Gate guard |
| Load Balancer | Receptionist |
| VPN | Secret tunnel |
| VPC Peering | Private road |

## The moving objects

| Packet | Meaning |
|---|---|
| &#9993;&#65039; Envelope | Visitor request |
| &#128190; Floppy disk | Data moving web -> app -> database |
| &#128257; Repeat arrows | Database replication between zones |
| &#128230; Package | Software update leaving via NAT and the gate |
| &#128520; Devil | Intruder, stopped by the guards |
| &#128274; Lock | Office VPN traffic |
| &#129309; Handshake | Partner VPC peering |

## The 9 steps

Each step adds to the picture. Clicking an earlier step goes back.

1. **VPC** - the AWS Cloud region and the fenced plot (10.0.0.0/16)
2. **Availability Zones** - two buildings, A and B
3. **Subnets** - public (gold) and private (purple) in each zone
4. **Internet Gateway** - the main gate, The Internet, Visitors, route table, first request
5. **Load Balancer** - the receptionist and web servers in both zones
6. **Servers and Database** - app servers, database, live copy in zone B, replication
7. **NAT Gateway** - software updates leave safely
8. **Security** - SG guards, NACLs, and a blocked intruder
9. **VPN and Peering** - office tunnel and Partner VPC

## Run locally

```bash
cd vpc-visual
python3 -m http.server 8000
```

Open http://localhost:8000

## Host on GitHub Pages

1. Create a new repository on GitHub and upload the contents of the `vpc-visual` folder (so `index.html` is at the root).
2. Go to **Settings > Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, then select the **main** branch and the **/ (root)** folder, and click **Save**.
4. Wait a minute. Your site appears at `https://<your-username>.github.io/<repo-name>/`.

## Project structure

```
vpc-visual/
  index.html      page structure only
  css/style.css   page and diagram styles, colours
  js/app.js       SVG builder, step data, caption text
  .nojekyll       tells GitHub Pages to serve files as they are
  LICENSE         MIT
  README.md
```

## Customise

- **Text:** edit the `STEPS` array at the top of `js/app.js` (title, subtitle, plain words, technical name, what to watch).
- **Picture:** the `build()` function in `js/app.js` uses small helpers: `box`, `tag`, `wire`, `packet`. The first number is the step on which a piece appears.
- **Colours:** change the variables at the top of `css/style.css` (`--blue` cloud/zones, `--teal` VPC, `--gold` public, `--purple` private, `--red` security, `--green` office link).
- **Licence:** replace "Nagothi Kavya Sree" in `LICENSE` with your name.
