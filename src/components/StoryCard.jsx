var TYPE_ICONS = {
  duration: '\u23F0',
  spatial: '\uD83C\uDF0D',
  density: '\u2728',
  contrast: '\uD83D\uDD04',
  discovery: '\uD83D\uDD0D',
  milestone: '\uD83C\uDFC6'
};

function StoryCard(props) {
  var story = props.story;
  var onClick = props.onClick;
  if (!story) return null;

  return (
    <div className="story-card" onClick={onClick}>
      <div className="story-card-icon">{TYPE_ICONS[story.type] || '\uD83D\uDCD6'}</div>
      <div className="story-card-body">
        <h3 className="story-card-title">{story.title}</h3>
        <p className="story-card-summary">{story.summary}</p>
      </div>
    </div>
  );
}

export default StoryCard;
