// This script fixes iframe sandbox issues by ensuring necessary permissions are added
(function() {
  // Function to find and fix iframe sandbox attributes
  function fixIframeSandboxes() {
    const iframes = document.querySelectorAll('iframe[sandbox]');
    iframes.forEach(iframe => {
      const currentSandbox = iframe.getAttribute('sandbox');
      const requiredPermissions = ['allow-scripts', 'allow-same-origin', 'allow-forms', 'allow-popups'];
      
      // Add missing permissions
      let newSandboxValue = currentSandbox || '';
      requiredPermissions.forEach(permission => {
        if (!newSandboxValue.includes(permission)) {
          newSandboxValue += ' ' + permission;
        }
      });
      
      iframe.setAttribute('sandbox', newSandboxValue.trim());
    });
  }

  // Initial run and setup a mutation observer to catch future iframes
  document.addEventListener('DOMContentLoaded', function() {
    fixIframeSandboxes();
    
    // Setup observer to watch for newly added iframes
    const observer = new MutationObserver(function(mutations) {
      let shouldFixIframes = false;
      
      mutations.forEach(function(mutation) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(function(node) {
            if (node.nodeName === 'IFRAME' || 
                (node.nodeType === 1 && node.querySelector('iframe'))) {
              shouldFixIframes = true;
            }
          });
        }
      });
      
      if (shouldFixIframes) {
        fixIframeSandboxes();
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  });
})(); 