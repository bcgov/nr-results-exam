import React, { PropsWithChildren } from 'react';

const renderMock = vi.fn();

const createRootMock = vi.fn(() => ({
  render: renderMock,
}));

let ClassPrefixComponent: (props: PropsWithChildren<{ prefix: string }>) => JSX.Element;

function mockBootstrapModules() {
  vi.doMock('react-dom/client', () => ({
    createRoot: createRootMock,
  }));

  vi.doMock('../App', () => ({
    default: () => <div data-testid="app-root" />,
  }));

  vi.doMock('../utils/ThemePreference', () => ({
    ThemePreference: ({ children }: PropsWithChildren<unknown>) => (
      <div data-testid="theme-wrapper">{children}</div>
    ),
  }));

  vi.doMock('../contexts/AuthProvider', () => ({
    AuthProvider: ({ children }: PropsWithChildren<unknown>) => (
      <div data-testid="auth-provider">{children}</div>
    ),
  }));

  vi.doMock('bootstrap/dist/css/bootstrap.min.css', () => ({}));
  vi.doMock('bootstrap/dist/js/bootstrap.bundle.min', () => ({}));

  ClassPrefixComponent = ({ children, prefix }: PropsWithChildren<{ prefix: string }>) => (
    <div data-testid="class-prefix" data-prefix={prefix}>
      {children}
    </div>
  );

  vi.doMock('@carbon/react', () => ({
    ClassPrefix: ClassPrefixComponent,
  }));
}

describe('application bootstrap', () => {
  beforeEach(() => {
    vi.resetModules();
    renderMock.mockReset();
    createRootMock.mockClear();
  });

  afterEach(() => {
    vi.unmock('react-dom/client');
    vi.unmock('../App');
    vi.unmock('../utils/ThemePreference');
    vi.unmock('../contexts/AuthProvider');
    vi.unmock('@carbon/react');
    vi.unmock('bootstrap/dist/css/bootstrap.min.css');
    vi.unmock('bootstrap/dist/js/bootstrap.bundle.min');
    document.body.innerHTML = '';
  });

  test('hydrates the root element and renders app', async () => {
    const container = document.createElement('div');
    container.id = 'root';
    document.body.appendChild(container);

    mockBootstrapModules();

    await import('../index');

    expect(createRootMock).toHaveBeenCalledWith(container);
    expect(renderMock).toHaveBeenCalledTimes(1);

    const strictModeElement = renderMock.mock.calls[0][0];
    const classPrefixElement = strictModeElement.props.children;
    expect(classPrefixElement.type).toBe(ClassPrefixComponent);
    expect(classPrefixElement.props.prefix).toBe('bx');
  });

  test('throws when root container is missing', async () => {
    mockBootstrapModules();

    await expect(import('../index')).rejects.toThrowError('Root element not found');

    expect(createRootMock).not.toHaveBeenCalled();
  });
});
