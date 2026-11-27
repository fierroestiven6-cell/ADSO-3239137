export default function CardStat({ title, value, icon: Icon }) {
  return (
    <article className="stat-card">
      <div className="stat-icon">{Icon && <Icon size={25} />}</div>
      <div>
        <h3>{value}</h3>
        <p>{title}</p>
      </div>
    </article>
  );
}
