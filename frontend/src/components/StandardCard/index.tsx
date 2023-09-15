import React from 'react';

import { useNavigate } from 'react-router-dom';

import { Tile, IconButton } from '@carbon/react';
import * as Icons from '@carbon/icons-react';
import * as Pictograms from '@carbon/pictograms-react';

import './styles.scss';

interface StandardCardProps {
  header: string;
  description: string;
  url: string;
  image: string;
  type: string;
  isEmpty: boolean;
  emptyTitle: string;
  emptyDescription: string;
}

const StandardCard = ({
  header, description, url, image, isEmpty
}: StandardCardProps) => {
  const navigate = useNavigate();
  const Image = Pictograms[image];
  return (
    <Tile className="std-card-main" onClick={() => navigate(url)}>
      <div className="std-card-header">
        <div>
          <p className="std-card-title">{header}</p>
          <div className="std-card-description">
            <p>{description}</p>
          </div>
        </div>
        {
          !isEmpty
          && (
          <IconButton className="std-card-button" kind="ghost" label="Go" align="bottom" onClick={() => { navigate(`${url}`); }}>
            <Icons.ArrowRight />
          </IconButton>
          )
        }
      </div>
    </Tile>
  );
};

export default StandardCard;
