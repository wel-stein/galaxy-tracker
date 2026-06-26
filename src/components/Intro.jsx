// The landing screen shown before the user grants permissions.
export function Intro({ onStart }) {
  return (
    <section id="intro">
      <div className="eyebrow mono" style={{ marginTop: 28 }}>
        R.A. 17ʰ45ᵐ · DEC −29°
      </div>
      <h1>寻找银河中心</h1>
      <p className="lead">
        举起手机,跟着光点转动方向。金色十字落入中央,你就正对着人马座方向的银心
        —— 银河最亮的核心。
      </p>
      <button className="btn" style={{ marginTop: 24 }} onClick={onStart}>
        举起手机 · 开始
      </button>
      <p className="tip">
        需要授权「定位」与「运动/方向」。
        <b>必须用 HTTPS 网址、在手机浏览器里全屏打开</b>
        (不能是聊天里的预览框)。
      </p>
    </section>
  )
}
