import { install } from 'source-map-support';
import map from './index.js.map';

install({ retrieveSourceMap: () => ({ map }) });
