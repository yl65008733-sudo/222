import { useEffect, useMemo, useState } from "react";
import { getChapterKey, journeys } from "./data/trips";
import { isGuestbookConfigured, supabase } from "./lib/supabase";

const MAX_NAME_LENGTH = 24;
const MAX_MESSAGE_LENGTH = 220;

const fallbackNotes = [
  {
    id: "demo-1",
    name: "朋友A",
    message: "这一页已经有那种一打开就会想起大家的感觉了。",
    chapter_key: "taizhou:taizhou-sea",
    image_url: "",
  },
  {
    id: "demo-2",
    name: "朋友B",
    message: "重庆那几张闪光灯照片太有假期感了。",
    chapter_key: "chongqing:chongqing-play",
    image_url: "",
  },
];

function formatDate(value) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
  }).format(new Date(`${value}-01T00:00:00`));
}

function App() {
  const [activeId, setActiveId] = useState(journeys[0]?.id ?? "");
  const [notes, setNotes] = useState(fallbackNotes);
  const activeJourney = journeys.find((journey) => journey.id === activeId) ?? journeys[0];

  useEffect(() => {
    let isMounted = true;

    async function loadNotes() {
      if (!isGuestbookConfigured) return;

      const { data, error } = await supabase
        .from("guestbook_messages")
        .select("id, name, message, chapter_key, image_url, created_at")
        .order("created_at", { ascending: false })
        .limit(120);

      if (!isMounted) return;
      if (!error) setNotes(data ?? []);
    }

    loadNotes();

    return () => {
      isMounted = false;
    };
  }, []);

  const stats = useMemo(() => {
    const chapterCount = journeys.reduce((total, journey) => total + journey.chapters.length, 0);
    const photoCount = journeys.reduce(
      (total, journey) =>
        total + journey.chapters.reduce((sum, chapter) => sum + chapter.photos.length, 0),
      0,
    );

    return [
      { value: journeys.length, label: "座城市" },
      { value: chapterCount, label: "个片段" },
      { value: photoCount, label: "张照片" },
    ];
  }, []);

  return (
    <div className="site-shell">
      <Hero journeys={journeys} stats={stats} onSelect={setActiveId} />
      <main>
        <CityPicker journeys={journeys} activeId={activeId} onSelect={setActiveId} />
        <JourneyView journey={activeJourney} notes={notes} onAddNote={setNotes} />
      </main>
      <footer className="footer">
        <span>这些路还会继续往后写。</span>
      </footer>
    </div>
  );
}

function Hero({ journeys, stats, onSelect }) {
  return (
    <header className="hero">
      <div className="hero__copy">
        <p className="eyebrow">青春旅行存档</p>
        <h1>我们把出发过的地方放在这里</h1>
        <p>
          台州的海边、南京的摩天轮、重庆的火锅夜、南昌的草地和饭桌。先做成一个可以点进去慢慢看的网站，
          后面每次旅行都能继续加。
        </p>
        <div className="hero__stats">
          {stats.map((item) => (
            <div className="stat" key={item.label}>
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="hero__stack" aria-label="旅行封面">
        {journeys.slice(0, 4).map((journey, index) => (
          <button
            className={`cover-card cover-card--${index + 1}`}
            key={journey.id}
            type="button"
            onClick={() => onSelect(journey.id)}
          >
            <img src={journey.cover} alt={`${journey.city}封面`} />
            <span>{journey.city}</span>
          </button>
        ))}
      </div>
    </header>
  );
}

function CityPicker({ journeys, activeId, onSelect }) {
  return (
    <section className="city-dock" aria-label="城市入口">
      {journeys.map((journey) => (
        <button
          className={journey.id === activeId ? "city-tab city-tab--active" : "city-tab"}
          key={journey.id}
          type="button"
          onClick={() => onSelect(journey.id)}
          style={{ "--accent": journey.color }}
        >
          <span>{journey.city}</span>
          <small>{formatDate(journey.date)}</small>
        </button>
      ))}
    </section>
  );
}

function JourneyView({ journey, notes, onAddNote }) {
  return (
    <section className="journey" style={{ "--accent": journey.color }}>
      <div className="journey__intro">
        <div>
          <p className="eyebrow">{journey.location}</p>
          <h2>{journey.title}</h2>
          <p>{journey.intro}</p>
        </div>
        <img src={journey.cover} alt={`${journey.city}旅行封面`} />
      </div>

      <div className="chapter-list">
        {journey.chapters.map((chapter, index) => {
          const chapterKey = getChapterKey(journey.id, chapter.id);
          const chapterNotes = notes.filter((note) => note.chapter_key === chapterKey);

          return (
            <article className="chapter" key={chapter.id}>
              <div className="chapter__heading">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <p>{chapter.kicker}</p>
                  <h3>{chapter.title}</h3>
                </div>
              </div>
              <p className="chapter__text">{chapter.text}</p>
              <PhotoGrid photos={chapter.photos} />
              <MemoryWall
                chapterKey={chapterKey}
                notes={chapterNotes}
                onAddNote={onAddNote}
              />
            </article>
          );
        })}
      </div>
    </section>
  );
}

function PhotoGrid({ photos }) {
  return (
    <div className="photo-grid">
      {photos.map((photo, index) => (
        <figure className="photo-tile" key={`${photo.src}-${index}`}>
          <img src={photo.src} alt={photo.alt} loading="lazy" />
          <figcaption>{photo.caption}</figcaption>
        </figure>
      ))}
    </div>
  );
}

function MemoryWall({ chapterKey, notes, onAddNote }) {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("idle");
  const [notice, setNotice] = useState("");

  async function uploadImage() {
    if (!file || !isGuestbookConfigured) return "";

    const extension = file.name.split(".").pop() || "jpg";
    const path = `${chapterKey.replace(":", "-")}/${Date.now()}.${extension}`;
    const { error } = await supabase.storage.from("guestbook-photos").upload(path, file);

    if (error) throw error;

    const { data } = supabase.storage.from("guestbook-photos").getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const trimmedName = name.trim();
    const trimmedMessage = message.trim();

    if (!trimmedName || !trimmedMessage) {
      setNotice("昵称和想说的话都写一下。");
      return;
    }

    if (trimmedName.length > MAX_NAME_LENGTH || trimmedMessage.length > MAX_MESSAGE_LENGTH) {
      setNotice("字数有点长，先短一点会更像评论区。");
      return;
    }

    setStatus("submitting");
    setNotice("");

    const localImage = file ? URL.createObjectURL(file) : "";

    try {
      const imageUrl = await uploadImage();
      const draft = {
        id: `${Date.now()}`,
        name: trimmedName,
        message: trimmedMessage,
        chapter_key: chapterKey,
        image_url: imageUrl || localImage,
      };

      if (isGuestbookConfigured) {
        const { data, error } = await supabase
          .from("guestbook_messages")
          .insert({
            name: trimmedName,
            message: trimmedMessage,
            chapter_key: chapterKey,
            image_url: imageUrl || null,
          })
          .select("id, name, message, chapter_key, image_url, created_at")
          .single();

        if (error) throw error;
        onAddNote((current) => [data, ...current]);
      } else {
        onAddNote((current) => [draft, ...current]);
        setNotice("现在是本地预览。接上 Supabase 后，评论和照片会真实保存。");
      }

      setName("");
      setMessage("");
      setFile(null);
    } catch {
      setNotice("刚刚没发出去，云端配置好后再试一次。");
    } finally {
      setStatus("idle");
    }
  }

  return (
    <div className="memory-wall">
      <div className="memory-wall__head">
        <strong>这一段下面的留言和照片</strong>
        <span>{notes.length} 条</span>
      </div>

      <form className="mini-form" onSubmit={handleSubmit}>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={MAX_NAME_LENGTH}
          placeholder="昵称"
        />
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          maxLength={MAX_MESSAGE_LENGTH}
          rows="3"
          placeholder="写一句这里发生过什么"
        />
        <div className="mini-form__actions">
          <label className="file-pill">
            <input
              type="file"
              accept="image/*"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
            {file ? file.name : "加一张照片"}
          </label>
          <button type="submit" disabled={status === "submitting"}>
            {status === "submitting" ? "发送中" : "发送"}
          </button>
        </div>
        {notice ? <p className="notice">{notice}</p> : null}
      </form>

      <div className="note-list">
        {notes.map((note) => (
          <article className="note" key={note.id}>
            <strong>{note.name}</strong>
            <p>{note.message}</p>
            {note.image_url ? <img src={note.image_url} alt={`${note.name}发的照片`} /> : null}
          </article>
        ))}
      </div>
    </div>
  );
}

export default App;
