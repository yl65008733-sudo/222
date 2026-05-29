import { useEffect, useMemo, useState } from "react";
import { trips } from "./data/trips";
import { isGuestbookConfigured, supabase } from "./lib/supabase";

const MAX_NAME_LENGTH = 24;
const MAX_MESSAGE_LENGTH = 240;

function formatMonth(value) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
  }).format(new Date(`${value}-01T00:00:00`));
}

function getTripLabel(tripId) {
  if (!tripId) return "整段旅程";
  return trips.find((trip) => trip.id === tripId)?.title ?? "一段旅程";
}

function Stat({ value, label }) {
  return (
    <div className="stat">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function Hero() {
  const stats = useMemo(() => {
    const people = new Set(trips.flatMap((trip) => trip.people));
    const peopleCount = trips.reduce(
      (total, trip) => total + (trip.peopleCount ?? 0),
      0,
    );
    const places = new Set(trips.map((trip) => trip.location));

    return {
      tripCount: trips.length,
      placeCount: places.size,
      peopleCount: peopleCount || people.size,
    };
  }, []);

  return (
    <header className="hero">
      <div className="hero__content">
        <p className="eyebrow">Travel notes since last year</p>
        <h1>我们的旅行纪念册</h1>
        <p className="hero__copy">
          给一起出发的人留一页：那些路上没说完的话、没摆好的合照、还有每次回来之后依然会想起的瞬间。
        </p>
        <div className="hero__stats" aria-label="旅行统计">
          <Stat value={stats.tripCount} label="段旅程" />
          <Stat value={stats.placeCount} label="个地方" />
          <Stat value={stats.peopleCount} label="位朋友" />
        </div>
      </div>
      <div className="hero__film" aria-hidden="true">
        {trips.slice(0, 3).map((trip, index) => (
          <figure className={`film-card film-card--${index + 1}`} key={trip.id}>
            <img src={trip.photos[0].src} alt="" />
            <figcaption>{trip.location}</figcaption>
          </figure>
        ))}
      </div>
    </header>
  );
}

function TripCard({ trip, index }) {
  return (
    <article className="trip-card">
      <div className="trip-card__marker" aria-hidden="true">
        {String(index + 1).padStart(2, "0")}
      </div>
      <div className="trip-card__body">
        <div className="trip-card__meta">
          <span>{formatMonth(trip.date)}</span>
          <span>{trip.location}</span>
        </div>
        <h2>{trip.title}</h2>
        <p>{trip.summary}</p>
        <div className="highlight">
          <span>高光瞬间</span>
          <strong>{trip.highlight}</strong>
        </div>
        <div className="people-list" aria-label={`${trip.title}同行朋友`}>
          {trip.people.map((person) => (
            <span key={person}>{person}</span>
          ))}
        </div>
        <div className="photo-grid">
          {trip.photos.map((photo, photoIndex) => (
            <figure className="photo-card" key={photo.src}>
              <img src={photo.src} alt={photo.alt} loading="lazy" />
              <figcaption>
                <span>{String(photoIndex + 1).padStart(2, "0")}</span>
                {photo.caption}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </article>
  );
}

function Timeline() {
  return (
    <section className="section timeline-section" aria-labelledby="timeline-title">
      <div className="section-heading">
        <p className="eyebrow">Timeline</p>
        <h2 id="timeline-title">从第一次出发开始</h2>
      </div>
      <div className="timeline">
        {trips.map((trip, index) => (
          <TripCard trip={trip} index={index} key={trip.id} />
        ))}
      </div>
    </section>
  );
}

function Guestbook() {
  const [messages, setMessages] = useState([]);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [tripId, setTripId] = useState("");
  const [status, setStatus] = useState("idle");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadMessages() {
      if (!isGuestbookConfigured) {
        setMessages([
          {
            id: "demo-1",
            name: "Mia",
            message: "下次旅行也要把这页继续写下去。",
            trip_id: "summer-seaside",
            created_at: new Date().toISOString(),
          },
          {
            id: "demo-2",
            name: "小林",
            message: "最喜欢那些没有计划、但刚好很开心的下午。",
            trip_id: null,
            created_at: new Date().toISOString(),
          },
        ]);
        return;
      }

      setStatus("loading");
      const { data, error } = await supabase
        .from("guestbook_messages")
        .select("id, name, message, trip_id, created_at")
        .order("created_at", { ascending: false })
        .limit(50);

      if (!isMounted) return;

      if (error) {
        setNotice("留言暂时没有加载成功，稍后再试一次。");
      } else {
        setMessages(data ?? []);
      }
      setStatus("idle");
    }

    loadMessages();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();

    const trimmedName = name.trim();
    const trimmedMessage = message.trim();

    if (!trimmedName || !trimmedMessage) {
      setNotice("昵称和留言都要写一点。");
      return;
    }

    if (trimmedName.length > MAX_NAME_LENGTH) {
      setNotice(`昵称最多 ${MAX_NAME_LENGTH} 个字。`);
      return;
    }

    if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
      setNotice(`留言最多 ${MAX_MESSAGE_LENGTH} 个字。`);
      return;
    }

    if (!isGuestbookConfigured) {
      setNotice("连接 Supabase 后，这里就可以真实保存留言。");
      return;
    }

    setStatus("submitting");
    setNotice("");

    const payload = {
      name: trimmedName,
      message: trimmedMessage,
      trip_id: tripId || null,
    };

    const { data, error } = await supabase
      .from("guestbook_messages")
      .insert(payload)
      .select("id, name, message, trip_id, created_at")
      .single();

    if (error) {
      setNotice("留言没有送出去，检查网络后再试一次。");
      setStatus("idle");
      return;
    }

    setMessages((current) => [data, ...current]);
    setName("");
    setMessage("");
    setTripId("");
    setNotice("已经留下来了。");
    setStatus("idle");
  }

  const isBusy = status === "submitting" || status === "loading";

  return (
    <section className="section guestbook-section" aria-labelledby="guestbook-title">
      <div className="section-heading">
        <p className="eyebrow">Guestbook</p>
        <h2 id="guestbook-title">给这段路留一句话</h2>
      </div>
      <div className="guestbook">
        <form className="guestbook-form" onSubmit={handleSubmit}>
          <label>
            <span>昵称</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={MAX_NAME_LENGTH}
              placeholder="写一个大家认得出的名字"
            />
          </label>
          <label>
            <span>想写给哪段旅程</span>
            <select
              value={tripId}
              onChange={(event) => setTripId(event.target.value)}
            >
              <option value="">整段旅程</option>
              {trips.map((trip) => (
                <option key={trip.id} value={trip.id}>
                  {trip.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>留言</span>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              maxLength={MAX_MESSAGE_LENGTH}
              placeholder="写下一个会让大家想起当时的瞬间"
              rows="5"
            />
          </label>
          <div className="form-footer">
            <span>{message.trim().length}/{MAX_MESSAGE_LENGTH}</span>
            <button type="submit" disabled={isBusy}>
              {status === "submitting" ? "正在留下..." : "留下这一句"}
            </button>
          </div>
          {notice ? <p className="form-notice">{notice}</p> : null}
          {!isGuestbookConfigured ? (
            <p className="setup-note">
              当前先展示两句示例留言。连接好云端后，朋友写下的话会留在这里。
            </p>
          ) : null}
        </form>

        <div className="message-list" aria-live="polite">
          {messages.map((item) => (
            <article className="message-card" key={item.id}>
              <div>
                <strong>{item.name}</strong>
                <span>{getTripLabel(item.trip_id)}</span>
              </div>
              <p>{item.message}</p>
            </article>
          ))}
          {!messages.length && status !== "loading" ? (
            <p className="empty-state">还没有留言，第一句可以从这里开始。</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function App() {
  return (
    <>
      <Hero />
      <main>
        <Timeline />
        <Guestbook />
      </main>
      <footer className="footer">
        <p>下一次出发之前，这里先替我们记着。</p>
      </footer>
    </>
  );
}

export default App;
