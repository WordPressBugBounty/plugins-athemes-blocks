const LEGACY_STYLE_ID_PATTERN = /^athemes-blocks-block-(desktop|tablet|mobile)-[a-f0-9]{8}$/i;
const EDITOR_IFRAME_SELECTOR = 'iframe[name="editor-canvas"]';

let boundEditorIframe = null;

const getEditorDocument = () => {
	return boundEditorIframe?.contentDocument || null;
};

const syncLegacyStyle = ( sourceStyle ) => {
	if (
		! ( sourceStyle instanceof HTMLStyleElement ) ||
		! LEGACY_STYLE_ID_PATTERN.test( sourceStyle.id )
	) {
		return;
	}

	const editorDocument = getEditorDocument();
	if ( ! editorDocument?.head ) {
		return;
	}

	let targetStyle = editorDocument.getElementById( sourceStyle.id );
	if ( ! targetStyle ) {
		targetStyle = editorDocument.createElement( 'style' );
		targetStyle.id = sourceStyle.id;
		editorDocument.head.appendChild( targetStyle );
	}

	targetStyle.textContent = sourceStyle.textContent;
};

const syncLegacyStyles = () => {
	document.querySelectorAll( 'style[id^="athemes-blocks-block-"]' ).forEach( syncLegacyStyle );
};

const observeLegacyStyles = () => {
	if ( ! document.head ) {
		return;
	}

	const observer = new MutationObserver( ( mutations ) => {
		mutations.forEach( ( mutation ) => {
			const mutationTarget =
				mutation.target.nodeType === Node.TEXT_NODE
					? mutation.target.parentElement
					: mutation.target;

			syncLegacyStyle( mutationTarget );

			mutation.addedNodes.forEach( ( node ) => {
				syncLegacyStyle( node );
			} );
		} );
	} );

	observer.observe( document.head, {
		childList: true,
		characterData: true,
		subtree: true,
	} );
};

const bindEditorIframe = () => {
	const iframe = document.querySelector( EDITOR_IFRAME_SELECTOR );
	if ( iframe === boundEditorIframe ) {
		return;
	}

	if ( boundEditorIframe ) {
		boundEditorIframe.removeEventListener( 'load', syncLegacyStyles );
	}

	boundEditorIframe = iframe;
	if ( ! boundEditorIframe ) {
		return;
	}

	boundEditorIframe.addEventListener( 'load', syncLegacyStyles );
	syncLegacyStyles();
};

const initializeLegacyIframeStyles = () => {
	observeLegacyStyles();
	bindEditorIframe();

	if ( ! document.body ) {
		return;
	}

	const iframeObserver = new MutationObserver( bindEditorIframe );
	iframeObserver.observe( document.body, {
		childList: true,
		subtree: true,
	} );
};

if ( document.readyState === 'loading' ) {
	document.addEventListener( 'DOMContentLoaded', initializeLegacyIframeStyles, {
		once: true,
	} );
} else {
	initializeLegacyIframeStyles();
}
