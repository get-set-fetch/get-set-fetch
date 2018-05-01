// eslint-disable-next-line no-unused-vars
function genDynamicLinks(links) {
  const linkContainer = document.createElement('div');

  links.forEach((link) => {
    const anchor = document.createElement('a');
    anchor.href = link.href;

    const anchorText = document.createTextNode(link.text);
    anchor.appendChild(anchorText);

    linkContainer.appendChild(anchor);
  });

  document.body.appendChild(linkContainer);
}
