"use strict";

/* ===== Data awal ===== */
const STORAGE_KEY = "mochi-library-v1";
const CATEGORIES = ["Fiksi", "Non-Fiksi", "Anak", "Pengembangan Diri", "Sejarah"];
const COVERS = [
  ["#ffd1e3", "#ffb3d1"], ["#ffe0ec", "#ffc2d9"], ["#ffd9f0", "#f6b6ff"],
  ["#ffe6d5", "#ffbfa6"], ["#fff0b8", "#ffd1a1"], ["#d9ecff", "#ffc9e6"], ["#e6d9ff", "#ffc2e0"]
];

const DEFAULT_BOOKS = [
  { title: "Laskar Pelangi", author: "Andrea Hirata", cat: "Fiksi", year: 2005, emoji: "🌈", desc: "Kisah sepuluh anak di Belitung yang gigih bersekolah dengan segala keterbatasan." },
  { title: "Bumi Manusia", author: "Pramoedya Ananta Toer", cat: "Sejarah", year: 1980, emoji: "🌍", desc: "Roman sejarah tentang Minke di masa kolonial dan perjuangan mencari keadilan." },
  { title: "Filosofi Teras", author: "Henry Manampiring", cat: "Pengembangan Diri", year: 2018, emoji: "🏛️", desc: "Pengantar filsafat Stoa agar hati lebih tenang menghadapi hidup sehari-hari." },
  { title: "Atomic Habits", author: "James Clear", cat: "Pengembangan Diri", year: 2018, emoji: "⚛️", desc: "Cara membangun kebiasaan kecil yang memberi hasil besar dari waktu ke waktu." },
  { title: "Sapiens", author: "Yuval Noah Harari", cat: "Sejarah", year: 2011, emoji: "🦴", desc: "Ringkasan perjalanan umat manusia dari zaman batu hingga era modern." },
  { title: "Negeri 5 Menara", author: "Ahmad Fuadi", cat: "Fiksi", year: 2009, emoji: "🗼", desc: "Enam santri dengan mimpi besar belajar di pesantren, Man Jadda Wajada!" },
  { title: "Pulang", author: "Tere Liye", cat: "Fiksi", year: 2015, emoji: "🏡", desc: "Petualangan seorang pemuda yang dibesarkan dunia gelap dan mencari arti pulang." },
  { title: "Dilan 1990", author: "Pidi Baiq", cat: "Fiksi", year: 2014, emoji: "💌", desc: "Kisah cinta remaja Bandung yang manis, jenaka, dan penuh kenangan." },
  { title: "Madre", author: "Dee Lestari", cat: "Fiksi", year: 2011, emoji: "🍞", desc: "Kumpulan cerita pendek dengan sentuhan magis dan rasa hangat." },
  { title: "Cerita Rakyat Si Kancil", author: "Tim Dongeng Nusantara", cat: "Anak", year: 2020, emoji: "🦌", desc: "Dongeng kancil yang cerdik, penuh pesan baik untuk adik-adik." },
  { title: "Sejarah Dunia yang Disembunyikan", author: "Jonathan Black", cat: "Sejarah", year: 2007, emoji: "🗝️", desc: "Menelusuri sisi lain sejarah dari sudut pandang tradisi rahasia." },
  { title: "Rich Dad Poor Dad", author: "Robert Kiyosaki", cat: "Non-Fiksi", year: 1997, emoji: "💰", desc: "Dua cara pandang tentang uang dan bagaimana membuat uang bekerja untukmu." }
];

/* ===== State ===== */
let books = loadBooks();
let state = { tab: "all", q: "", cat: "Semua", sort: "title" };

function loadBooks() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(saved) && saved.length) return saved;
  } catch (e) { /* abaikan */ }
  return DEFAULT_BOOKS.map((b, i) => ({ ...b, id: "b" + (i + 1), added: i, borrower: null, due: null, fav: false }));
}
function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(books)); } catch (e) { /* abaikan */ }
}

/* ===== Util ===== */
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const hash = (s) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
const coverStyle = (b) => { const [a, c] = COVERS[hash(b.id) % COVERS.length]; return `background:linear-gradient(145deg,${a},${c})`; };
const fmtDate = (iso) => new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
const isLate = (b) => b.borrower && b.due && new Date(b.due) < new Date(new Date().toDateString());

let toastTimer;
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
}

const MOCHI_SAYS = [
  "Halo! Mau baca apa hari ini? 🎀",
  "Buku itu seperti pelukan hangat 💗",
  "Jangan lupa istirahat, ya! 🍓",
  "Ayo kembalikan tepat waktu~ ✨",
  "Satu halaman sehari, lama-lama jadi satu buku! 📖",
  "Mochi suka bau buku baru 🌸"
];

/* ===== Render ===== */
function visibleBooks() {
  const q = state.q.trim().toLowerCase();
  let list = books.filter((b) => {
    if (state.tab === "available" && b.borrower) return false;
    if (state.tab === "borrowed" && !b.borrower) return false;
    if (state.tab === "fav" && !b.fav) return false;
    if (state.cat !== "Semua" && b.cat !== state.cat) return false;
    if (q && !(b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q))) return false;
    return true;
  });
  const by = state.sort;
  list.sort((a, b) =>
    by === "newest" ? (b.added ?? 0) - (a.added ?? 0) : a[by].localeCompare(b[by], "id")
  );
  return list;
}

function badgeFor(b) {
  if (!b.borrower) return '<span class="badge ok">🍓 Tersedia</span>';
  if (isLate(b)) return '<span class="badge late">⏰ Terlambat</span>';
  return '<span class="badge out">🎀 Dipinjam</span>';
}

function renderStats() {
  const borrowed = books.filter((b) => b.borrower).length;
  $("#statTotal").textContent = books.length;
  $("#statBorrowed").textContent = borrowed;
  $("#statAvail").textContent = books.length - borrowed;
  $("#statFav").textContent = books.filter((b) => b.fav).length;
}

function render() {
  const list = visibleBooks();
  $("#grid").innerHTML = list.map((b, i) => `
    <article class="card" tabindex="0" data-id="${esc(b.id)}" style="animation-delay:${Math.min(i, 12) * 40}ms" aria-label="${esc(b.title)}">
      <button class="fav ${b.fav ? "on" : ""}" data-fav="${esc(b.id)}" aria-label="${b.fav ? "Hapus dari favorit" : "Tambah ke favorit"}" aria-pressed="${b.fav}">${b.fav ? "💖" : "🤍"}</button>
      <div class="cover" style="${coverStyle(b)}">
        <span class="emoji">${esc(b.emoji || "📕")}</span>
        <span class="ct">${esc(b.title)}</span>
      </div>
      <h3>${esc(b.title)}</h3>
      <p class="author">${esc(b.author)}</p>
      ${badgeFor(b)}
    </article>`).join("");
  $("#empty").hidden = list.length > 0;
  renderStats();
}

/* ===== Detail dialog ===== */
let openId = null;
function openDetail(id) {
  const b = books.find((x) => x.id === id);
  if (!b) return;
  openId = id;
  const status = b.borrower
    ? `<div class="borrow-box">🎀 Dipinjam oleh <b>${esc(b.borrower)}</b><br>Kembali paling lambat: <b>${esc(fmtDate(b.due))}</b>${isLate(b) ? " ⏰ (terlambat!)" : ""}</div>`
    : `<form class="borrow-box" id="borrowForm">
         <label for="borrowerName"><b>Pinjam buku ini</b> (7 hari)</label>
         <input id="borrowerName" required maxlength="40" placeholder="Nama peminjam" autocomplete="name" />
         <button class="btn btn-primary" type="submit">Pinjam 🍓</button>
       </form>`;
  $("#detailBody").innerHTML = `
    <div class="cover" style="${coverStyle(b)}"><span class="emoji">${esc(b.emoji || "📕")}</span><span class="ct">${esc(b.title)}</span></div>
    <div>
      <h2>${esc(b.title)}</h2>
      <p class="meta">oleh ${esc(b.author)} · ${esc(b.cat)}${b.year ? " · " + esc(b.year) : ""}</p>
      ${badgeFor(b)}
      <p class="desc">${esc(b.desc || "Belum ada sinopsis untuk buku ini.")}</p>
      ${status}
      <div class="actions" style="margin-top:12px">
        ${b.borrower ? '<button class="btn btn-primary" id="returnBtn">Kembalikan 💗</button>' : ""}
        <button class="btn btn-soft" id="favBtn">${b.fav ? "💖 Favorit" : "🤍 Favoritkan"}</button>
        <button class="btn btn-danger" id="delBtn">Hapus</button>
      </div>
    </div>`;
  $("#detail").showModal();
}

function refreshDetail() { if ($("#detail").open && openId) openDetail(openId); }

/* ===== Aksi ===== */
function toggleFav(id) {
  const b = books.find((x) => x.id === id);
  if (!b) return;
  b.fav = !b.fav;
  save(); render(); refreshDetail();
  toast(b.fav ? "Ditambahkan ke favorit 💖" : "Dihapus dari favorit 🤍");
}

function borrow(id, name) {
  const b = books.find((x) => x.id === id);
  if (!b || b.borrower) return;
  const due = new Date(); due.setDate(due.getDate() + 7);
  b.borrower = name.trim();
  b.due = due.toISOString();
  save(); render(); refreshDetail();
  toast(`Yay! "${b.title}" dipinjam ${b.borrower} 🎀`);
}

function giveBack(id) {
  const b = books.find((x) => x.id === id);
  if (!b) return;
  b.borrower = null; b.due = null;
  save(); render(); refreshDetail();
  toast("Terima kasih sudah mengembalikan 💗");
}

function removeBook(id) {
  const b = books.find((x) => x.id === id);
  if (!b || !confirm(`Hapus "${b.title}" dari perpustakaan?`)) return;
  books = books.filter((x) => x.id !== id);
  save(); render();
  $("#detail").close();
  toast("Buku dihapus 🥺");
}

/* ===== Event ===== */
$("#grid").addEventListener("click", (e) => {
  const favBtn = e.target.closest("[data-fav]");
  if (favBtn) { e.stopPropagation(); toggleFav(favBtn.dataset.fav); return; }
  const card = e.target.closest(".card");
  if (card) openDetail(card.dataset.id);
});
$("#grid").addEventListener("keydown", (e) => {
  if ((e.key === "Enter" || e.key === " ") && e.target.classList.contains("card")) {
    e.preventDefault();
    openDetail(e.target.dataset.id);
  }
});

$("#detailBody").addEventListener("click", (e) => {
  if (e.target.id === "favBtn") toggleFav(openId);
  if (e.target.id === "returnBtn") giveBack(openId);
  if (e.target.id === "delBtn") removeBook(openId);
});
$("#detailBody").addEventListener("submit", (e) => {
  if (e.target.id === "borrowForm") {
    e.preventDefault();
    borrow(openId, $("#borrowerName").value);
  }
});

$("#search").addEventListener("input", (e) => { state.q = e.target.value; render(); });
$("#category").addEventListener("change", (e) => { state.cat = e.target.value; render(); });
$("#sort").addEventListener("change", (e) => { state.sort = e.target.value; render(); });
$("#tabs").addEventListener("click", (e) => {
  const t = e.target.closest(".tab");
  if (!t) return;
  document.querySelectorAll(".tab").forEach((x) => x.classList.toggle("active", x === t));
  state.tab = t.dataset.tab;
  render();
});

/* Tambah buku */
$("#openAdd").addEventListener("click", () => $("#addDialog").showModal());
$("#addForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  const nextNum = books.reduce((m, b) => Math.max(m, parseInt(String(b.id).replace(/\D/g, ""), 10) || 0), 0) + 1;
  const maxAdded = books.reduce((m, b) => Math.max(m, b.added ?? 0), 0);
  books.push({
    id: "b" + nextNum,
    added: maxAdded + 1,
    title: f.get("title").trim(),
    author: f.get("author").trim(),
    cat: f.get("cat"),
    year: f.get("year") || "",
    emoji: (f.get("emoji") || "📕").trim() || "📕",
    desc: f.get("desc").trim(),
    borrower: null, due: null, fav: false
  });
  save(); render();
  e.target.reset();
  e.target.elements.emoji.value = "📕";
  $("#addDialog").close();
  toast("Buku baru masuk rak! 📚💗");
});

/* Tutup dialog saat klik backdrop */
document.querySelectorAll("dialog").forEach((d) =>
  d.addEventListener("click", (e) => { if (e.target === d) d.close(); })
);

/* Maskot interaktif */
$("#mascot").addEventListener("click", (e) => {
  const m = e.currentTarget;
  m.classList.remove("jump"); void m.getBoundingClientRect(); m.classList.add("jump");
  $("#bubble").textContent = MOCHI_SAYS[Math.floor(Math.random() * MOCHI_SAYS.length)];
});

/* ===== Init ===== */
function init() {
  const opts = ["Semua", ...CATEGORIES];
  $("#category").innerHTML = opts.map((c) => `<option value="${c}">${c === "Semua" ? "Semua kategori" : c}</option>`).join("");
  $("#addCat").innerHTML = CATEGORIES.map((c) => `<option>${c}</option>`).join("");

  const icons = ["🌸", "💗", "✨", "🎀", "🍓", "🤍"];
  const box = $("#floaties");
  for (let i = 0; i < 16; i++) {
    const s = document.createElement("span");
    s.textContent = icons[i % icons.length];
    s.style.left = Math.random() * 100 + "%";
    s.style.fontSize = 14 + Math.random() * 18 + "px";
    s.style.animationDuration = 12 + Math.random() * 14 + "s";
    s.style.animationDelay = -Math.random() * 20 + "s";
    box.appendChild(s);
  }
  render();
}
init();
