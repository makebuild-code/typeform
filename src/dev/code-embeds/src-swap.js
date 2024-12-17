function updateScriptDomain() {
    const hasDevParam = new URLSearchParams(window.location.search).has('dev');
    
    // Only proceed if dev parameter is present
    if (!hasDevParam) return;
    
    const scriptDomain = 'https://www.typeform-scripts.local/';
  
    document.querySelectorAll('script[cc-ext-hosted-script]').forEach(script => {
      const srcPath = script.getAttribute('src');
      // Extract everything after 'typeform/' including query params
      const match = srcPath.match(/typeform\/(.*)/);
      const relativePath = match ? match[1] : srcPath.split('/').pop();
      
      const newScript = document.createElement('script');
      newScript.type = 'text/javascript';
      newScript.src = `${scriptDomain}${relativePath}`;
      
      newScript.onload = () => console.log(`Script loaded: ${newScript.src}`);
      newScript.onerror = (error) => console.error(`Script failed to load: ${newScript.src}`, error);
      
      script.remove();
      document.head.appendChild(newScript);
    });
  }
  
  document.addEventListener('DOMContentLoaded', updateScriptDomain);