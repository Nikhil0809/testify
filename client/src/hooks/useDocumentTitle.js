import { useEffect } from 'react';

const useDocumentTitle = (title) => {
  useEffect(() => {
    document.title = title ? `${title} · Testify` : 'Testify — Mini Online Test Platform';
  }, [title]);
};

export default useDocumentTitle;
