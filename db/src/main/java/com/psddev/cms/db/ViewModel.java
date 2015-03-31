package com.psddev.cms.db;

import com.psddev.dari.db.Recordable;
import com.psddev.dari.db.State;
import com.psddev.dari.util.ClassFinder;
import com.psddev.dari.util.StringUtils;
import com.psddev.dari.util.TypeDefinition;
import com.psddev.dari.util.WebPageContext;

public abstract class ViewModel<T extends Recordable> {

    private transient T model;
    private transient WebPageContext webPageContext;

    public T getModel() {
        return model;
    }

    public void setModel(T model) {
        this.model = model;
    }

    public WebPageContext getWebPageContext() {
        return webPageContext;
    }

    public void setWebPageContext(WebPageContext webPageContext) {
        this.webPageContext = webPageContext;
    }

    public static class Static {

        public static ViewModel<? extends Recordable> getInstance(WebPageContext page, Object object) {
            return getInstance(page, object, null);
        }

        public static ViewModel<? extends Recordable> getInstance(WebPageContext page, Object object, String context) {

            if (object == null || !(object instanceof Recordable)) {
                return null;
            }

            Recordable recordable = (Recordable) object;
            Renderer.TypeModification rendererData = State.getInstance(object).getType().as(Renderer.TypeModification.class);

            if (rendererData == null) {
                return null;
            }

            String viewModelClassName = null;

            if (!StringUtils.isBlank(context)) {
                viewModelClassName = rendererData.getContextAndViewModelClasses().get(context);
            }

            if (StringUtils.isBlank(viewModelClassName)) {
                viewModelClassName = rendererData.getViewModelClassName();
            }

            ViewModel<Recordable> viewModel = null;

            for (Class<? extends ViewModel> foundViewModelClass : ClassFinder.Static.findClasses(ViewModel.class)) {
                if (foundViewModelClass.getCanonicalName().equals(viewModelClassName)) {
                    TypeDefinition typeDef = TypeDefinition.getInstance(foundViewModelClass);
                    viewModel = (ViewModel<Recordable>) typeDef.newInstance();
                }
            }

            if (viewModel == null) {
                return null;
            }

            viewModel.setModel(recordable);
            viewModel.setWebPageContext(page);
            return viewModel;
        }

    }

}
