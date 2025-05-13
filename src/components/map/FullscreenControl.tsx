
import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

const FullscreenControl = () => {
  const map = useMap();
  
  useEffect(() => {
    // Only import if we're in a browser environment
    if (typeof window !== 'undefined') {
      // Create our own fullscreen control
      const fullscreenControl = L.Control.extend({
        options: {
          position: 'topright'
        },
        
        onAdd: function() {
          const container = L.DomUtil.create('div', 'leaflet-control-fullscreen leaflet-bar leaflet-control');
          const button = L.DomUtil.create('a', 'leaflet-control-fullscreen-button', container);
          button.href = '#';
          button.title = 'View Fullscreen';
          button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M1.5 1a.5.5 0 0 0-.5.5v4a.5.5 0 0 1-1 0v-4A1.5 1.5 0 0 1 1.5 0h4a.5.5 0 0 1 0 1h-4zM10 .5a.5.5 0 0 1 .5-.5h4A1.5 1.5 0 0 1 16 1.5v4a.5.5 0 0 1-1.5 1.5h-4a.5.5 0 0 1 0-1h4a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 1 .5-.5z"/></svg>';
          
          L.DomEvent.on(button, 'click', function (e) {
            L.DomEvent.stopPropagation(e);
            L.DomEvent.preventDefault(e);
            
            const docElm = document.documentElement;
            
            if (!document.fullscreenElement) {
              if (docElm.requestFullscreen) {
                docElm.requestFullscreen();
              }
              button.title = 'Exit Fullscreen';
              L.DomUtil.addClass(container, 'leaflet-fullscreen-on');
            } else {
              if (document.exitFullscreen) {
                document.exitFullscreen();
              }
              button.title = 'View Fullscreen';
              L.DomUtil.removeClass(container, 'leaflet-fullscreen-on');
            }
          });
          
          return container;
        }
      });
      
      map.addControl(new fullscreenControl());
      
      // Handle exit fullscreen via ESC key
      document.addEventListener('fullscreenchange', () => {
        const fullscreenButton = document.querySelector('.leaflet-control-fullscreen-button');
        if (!document.fullscreenElement && fullscreenButton) {
          (fullscreenButton as HTMLElement).title = 'View Fullscreen';
          const container = fullscreenButton.parentElement;
          if (container) {
            L.DomUtil.removeClass(container, 'leaflet-fullscreen-on');
          }
        }
      });
    }
    
    return () => {
      document.removeEventListener('fullscreenchange', () => {});
    };
  }, [map]);
  
  return null;
};

export default FullscreenControl;
