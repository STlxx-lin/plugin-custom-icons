import { Plugin, PluginManager } from '@nocobase/server';
import path from 'path';
import { createCustomIconsResource } from './actions/custom-icons';
import { createCustomIconReposResource } from './actions/custom-icon-repos';

function ensurePluginEnvironment() {
  if (!process.env.NODE_MODULES_PATH) {
    process.env.NODE_MODULES_PATH = path.resolve(process.cwd(), 'node_modules');
  }
  if (PluginManager) {
    const parsedNames = (PluginManager as any).parsedNames || ((PluginManager as any).parsedNames = {});
    parsedNames['custom-icons'] = {
      name: 'custom-icons',
      packageName: '@nocobase/plugin-custom-icons',
    };
    parsedNames['@nocobase/plugin-custom-icons'] = {
      name: 'custom-icons',
      packageName: '@nocobase/plugin-custom-icons',
    };
  }
}

ensurePluginEnvironment();

export class PluginCustomIconsServer extends Plugin {
  static async staticImport() {
    ensurePluginEnvironment();
  }

  async beforeLoad() {
    this.db.import({
      directory: path.resolve(__dirname, 'collections'),
    });
  }

  async load() {
    // 1. 注册 custom_icons 和 customIcons 资源与接口
    this.app.resource(createCustomIconsResource(this.app, 'custom_icons'));
    this.app.resource(createCustomIconsResource(this.app, 'customIcons'));

    // 2. 注册 customIconRepos 图标仓库资源与接口
    this.app.resource(createCustomIconReposResource(this.app, 'customIconRepos'));
    this.app.resource(createCustomIconReposResource(this.app, 'custom_icon_repos'));

    // 3. 注册 ACL 权限片段
    this.app.acl.registerSnippet({
      name: `pm.${this.name}.customIcons`,
      actions: ['custom_icons:*', 'customIcons:*', 'customIconRepos:*', 'custom_icon_repos:*'],
    });

    // 4. 允许公开/访客及已登录用户读取图标与分类（确保菜单、页面各处正常显示图标）
    this.app.acl.allow('customIcons', ['list', 'getCategories'], 'public');
    this.app.acl.allow('custom_icons', ['list', 'getCategories'], 'public');
    this.app.acl.allow('customIconRepos', ['list', 'probe', 'probeIconfont', 'getSettings'], 'loggedIn');
    this.app.acl.allow('custom_icon_repos', ['list', 'probe', 'probeIconfont', 'getSettings'], 'loggedIn');

    // 5. 管理权限接口（创建、更新、批量导入、删除、仓库安装与卸载、爬取、全局配置保存）仅允许管理员访问
    this.app.acl.allow('custom_icons', ['create', 'update', 'batchCreate', 'destroy'], 'admin');
    this.app.acl.allow('customIcons', ['create', 'update', 'batchCreate', 'destroy'], 'admin');
    this.app.acl.allow('customIconRepos', ['importIconfont', 'install', 'uninstall', 'crawlPage', 'saveSettings', 'updateRepo'], 'admin');
    this.app.acl.allow('custom_icon_repos', ['importIconfont', 'install', 'uninstall', 'crawlPage', 'saveSettings', 'updateRepo'], 'admin');
  }
}

export default PluginCustomIconsServer;
