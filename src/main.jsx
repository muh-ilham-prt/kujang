import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider, createHashRouter } from 'react-router-dom';
import './index.css';
import routes from './routes';

createRoot(document.getElementById('root')).render(
	<StrictMode>
		<RouterProvider router={createHashRouter(routes)} />
	</StrictMode>
);
