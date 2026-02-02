import { type QuickLink } from "../bridge/types";

type ContentAreaProps = {
  quickLinks: QuickLink[];
};

const ContentArea = ({ quickLinks }: ContentAreaProps) => {
  return (
    <section className="content-area">
      <div className="hero">
        <h1 className="hero-title">Lumen</h1>
        <p className="hero-tagline">
          A calmer window to the web. Collect thoughts, shift contexts, and breathe before the next
          click.
        </p>
      </div>
      <div className="quick-links">
        {quickLinks.map((link) => (
          <div key={link.id} className="quick-link">
            <span className="quick-icon">{link.icon}</span>
            <span>{link.name}</span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ContentArea;
