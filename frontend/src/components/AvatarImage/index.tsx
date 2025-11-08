import './AvatarImage.scss';

type Size = 'small' | 'large';

interface AvatarImageProps {
  userName: string;
  size: Size;
}

const getInitials = (userName: string) => {
  const trimmed = userName.trim();
  if (!trimmed) {
    return '';
  }

  const nameParts = trimmed.split(/\s+/);
  if (nameParts.length >= 2) {
    return `${nameParts[0]?.[0] ?? ''}${nameParts[1]?.[0] ?? ''}`.toUpperCase();
  } else if (nameParts.length === 1) {
    return (nameParts[0]?.[0] ?? '').toUpperCase();
  }
  return '';
};

const AvatarImage = ({ userName, size }: AvatarImageProps) => {
  const initials = getInitials(userName);

  return (
    <div className={`profile-image ${size}`}>
      <div className="initials">{initials}</div>
    </div>
  );
};

export default AvatarImage;
