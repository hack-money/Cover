import React, { ReactElement } from 'react';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Divider from '@material-ui/core/Divider';

import AddIcon from '@material-ui/icons/Add';
import ShoppingCartIcon from '@material-ui/icons/ShoppingCart';
import SwapHorizIcon from '@material-ui/icons/SwapHoriz';
import GitHubIcon from '@material-ui/icons/GitHub';

import Link from '../Link';

const mainLinks = [
  { text: 'Deposit', icon: <AddIcon />, url: '/deposit' },
  { text: 'Buy Options', icon: <ShoppingCartIcon />, url: '/options/buy' },
  { text: 'Exercise Options', icon: <SwapHorizIcon />, url: '/options/exercise' },
];

const secondaryLinks = [
  {
    text: 'Github',
    icon: <GitHubIcon />,
    url: 'https://github.com/hack-money/Cover',
  },
];

const NavLinkItem = ({ text, url, icon }: { text: string; url: string; icon: ReactElement }): ReactElement => (
  <ListItem button component={Link} to={url}>
    <ListItemIcon>{icon}</ListItemIcon>
    <ListItemText primary={text} />
  </ListItem>
);

const SideBarLinks = (): ReactElement => (
  <List>
    {mainLinks.map((link, index) => (
      <NavLinkItem url={link.url} icon={link.icon} text={link.text} key={index} />
    ))}
    <Divider />
    {secondaryLinks.map((link, index) => (
      <NavLinkItem url={link.url} icon={link.icon} text={link.text} key={index} />
    ))}
  </List>
);

export default SideBarLinks;
